#!/bin/bash
# =============================================================================
# Moveo CMS - Installation Script
# =============================================================================
# This script installs Moveo CMS on a fresh Linux server (Ubuntu/Debian)
#
# Usage:
#   chmod +x install.sh
#   sudo ./install.sh
#
# What this script does:
#   1. Updates the system
#   2. Installs Docker and Docker Compose
#   3. Configures UFW firewall
#   4. Generates secure secrets and creates .env
#   5. Builds all Docker images
#   6. Starts all services
#   7. Displays access URLs and credentials
#
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/install-$(date +%Y%m%d-%H%M%S).log"

# Logging function
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        INFO)
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        ERROR)
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        STEP)
            echo -e "\n${BLUE}==>${NC} ${CYAN}$message${NC}"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE" 2>/dev/null || true
}

# Generate secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d '/+=' | head -c 32
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log ERROR "Please run this script as root (sudo ./install.sh)"
        exit 1
    fi
}

# Update system
update_system() {
    log STEP "Updating system packages..."
    
    apt-get update -qq
    apt-get upgrade -y -qq
    
    log INFO "System updated ✓"
}

# Install Docker
install_docker() {
    log STEP "Installing Docker..."
    
    if command -v docker &> /dev/null; then
        log INFO "Docker is already installed"
        docker --version
    else
        # Install prerequisites
        apt-get install -y -qq ca-certificates curl gnupg lsb-release
        
        # Add Docker's official GPG key
        mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        
        # Set up the repository
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Install Docker Engine
        apt-get update -qq
        apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
        
        # Start and enable Docker
        systemctl start docker
        systemctl enable docker
        
        log INFO "Docker installed ✓"
    fi
    
    # Verify docker compose is available
    if docker compose version &> /dev/null; then
        log INFO "Docker Compose plugin is available"
    else
        log ERROR "Docker Compose plugin is not available"
        exit 1
    fi
}

# Configure firewall
configure_firewall() {
    log STEP "Configuring firewall..."
    
    if command -v ufw &> /dev/null; then
        # Allow SSH, HTTP, HTTPS, and management ports
        ufw allow 22/tcp    # SSH
        ufw allow 80/tcp    # HTTP
        ufw allow 443/tcp   # HTTPS
        ufw allow 81/tcp    # Nginx Proxy Manager Admin
        ufw allow 9443/tcp  # Portainer
        
        # Enable firewall if not already enabled
        if ! ufw status | grep -q "Status: active"; then
            echo "y" | ufw enable
        fi
        
        log INFO "Firewall configured ✓"
    else
        log WARN "UFW is not installed, skipping firewall configuration"
    fi
}

# Create .env file
create_env_file() {
    log STEP "Creating environment configuration..."
    
    if [ -f "$SCRIPT_DIR/.env" ]; then
        log WARN ".env file already exists, keeping existing configuration"
        return
    fi
    
    # Generate secrets
    local postgres_password=$(generate_secret)
    local jwt_secret=$(generate_secret)
    local npm_db_password=$(generate_secret)
    
    # Get server IP
    local server_ip=$(hostname -I | awk '{print $1}')
    
    cat > "$SCRIPT_DIR/.env" << EOF
# =============================================================================
# Moveo CMS - Environment Configuration
# Generated on $(date)
# =============================================================================

# Project name (used as prefix for containers)
COMPOSE_PROJECT_NAME=moveo

# Server Configuration
NGINX_PORT=8080
SITE_NAME=moveo-cms
DEFAULT_LANGUAGE=nl

# PostgreSQL Database
POSTGRES_USER=moveo
POSTGRES_PASSWORD=${postgres_password}
POSTGRES_DB=moveo_cms

# JWT Authentication
JWT_SECRET=${jwt_secret}
JWT_EXPIRES_IN=7d

# Nginx Proxy Manager Database
NPM_DB_PASSWORD=${npm_db_password}
EOF

    chmod 600 "$SCRIPT_DIR/.env"
    
    log INFO "Environment file created ✓"
    log INFO "PostgreSQL Password: ${postgres_password}"
    log INFO "JWT Secret: ${jwt_secret}"
}

# Create data directories
create_directories() {
    log STEP "Creating data directories..."
    
    mkdir -p "$SCRIPT_DIR/data/npm/data"
    mkdir -p "$SCRIPT_DIR/data/npm/letsencrypt"
    mkdir -p "$SCRIPT_DIR/data/npm/mysql"
    mkdir -p "$SCRIPT_DIR/data/portainer"
    mkdir -p "$SCRIPT_DIR/data/postgres"
    mkdir -p "$SCRIPT_DIR/backups"
    
    log INFO "Data directories created ✓"
}

# Build and start containers
start_services() {
    log STEP "Building Docker images..."
    
    cd "$SCRIPT_DIR"
    
    # Build images
    docker compose build --no-cache
    
    log INFO "Docker images built ✓"
    
    log STEP "Starting services..."
    
    # Start all services
    docker compose up -d
    
    # Wait for services to be healthy
    log INFO "Waiting for services to start..."
    sleep 30
    
    # Check if backend is healthy
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose ps | grep -q "healthy"; then
            break
        fi
        attempt=$((attempt + 1))
        sleep 5
        echo -n "."
    done
    echo ""
    
    log INFO "Services started ✓"
}

# Show completion message
show_completion() {
    local server_ip=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo -e "${GREEN}========================================"
    echo "  Moveo CMS Installation Complete!"
    echo "========================================${NC}"
    echo ""
    echo -e "${CYAN}Access URLs:${NC}"
    echo "  • Website:     http://${server_ip}:8080"
    echo "  • Admin Panel: http://${server_ip}:8080/admin"
    echo "  • NPM Admin:   http://${server_ip}:81"
    echo "  • Portainer:   https://${server_ip}:9443"
    echo ""
    echo -e "${CYAN}Default Credentials:${NC}"
    echo "  Moveo CMS Admin:"
    echo "    Email:    admin@moveo-bv.nl"
    echo "    Password: Admin123!"
    echo ""
    echo "  Nginx Proxy Manager:"
    echo "    Email:    admin@example.com"
    echo "    Password: changeme"
    echo ""
    echo "  Portainer:"
    echo "    Create admin account on first visit"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Change all default passwords after first login!${NC}"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo "  • View logs:     docker compose logs -f"
    echo "  • Stop services: docker compose down"
    echo "  • Start services: docker compose up -d"
    echo "  • Update:        ./update.sh"
    echo ""
    echo "Log file: $LOG_FILE"
    echo ""
}

# Main execution
main() {
    echo ""
    echo -e "${CYAN}========================================"
    echo "  Moveo CMS Installation Script"
    echo "========================================${NC}"
    echo ""
    
    check_root
    update_system
    install_docker
    configure_firewall
    create_directories
    create_env_file
    start_services
    show_completion
}

# Run main
main "$@"

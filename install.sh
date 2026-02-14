#!/bin/bash
###############################################################################
#  Moveo CMS - Complete Installation Script (Ubuntu/Debian)
#  Installs: Docker, Docker Compose, Portainer, Nginx Proxy Manager, Moveo CMS
###############################################################################
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              MOVEO CMS - COMPLETE INSTALLER                  ║"
    echo "║                     moveo-bv.nl                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if running as root or with sudo
check_sudo() {
    if [ "$EUID" -ne 0 ]; then
        if ! command -v sudo &> /dev/null; then
            echo -e "${RED}✗ This script requires root privileges. Please run as root or install sudo.${NC}"
            exit 1
        fi
        SUDO="sudo"
    else
        SUDO=""
    fi
}

print_header
check_sudo

###############################################################################
# STEP 1: System Update
###############################################################################
print_step "STEP 1/6: Updating System"

echo -e "${YELLOW}→ Running apt update...${NC}"
$SUDO apt update -y

echo -e "${YELLOW}→ Running apt upgrade...${NC}"
$SUDO apt upgrade -y

echo -e "${YELLOW}→ Installing essential packages...${NC}"
$SUDO apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    git \
    openssl \
    ufw

echo -e "${GREEN}✓ System updated and essential packages installed${NC}"

###############################################################################
# STEP 2: Install Docker
###############################################################################
print_step "STEP 2/6: Installing Docker"

if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | grep -oP 'Docker version \K[0-9.]+' || echo "installed")
    echo -e "${GREEN}✓ Docker is already installed (v${DOCKER_VERSION})${NC}"
else
    echo -e "${YELLOW}→ Adding Docker GPG key...${NC}"
    $SUDO install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    $SUDO chmod a+r /etc/apt/keyrings/docker.gpg

    echo -e "${YELLOW}→ Adding Docker repository...${NC}"
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null

    echo -e "${YELLOW}→ Installing Docker Engine...${NC}"
    $SUDO apt update -y
    $SUDO apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Add current user to docker group
    if [ -n "$SUDO_USER" ]; then
        $SUDO usermod -aG docker $SUDO_USER
        echo -e "${YELLOW}ℹ User '$SUDO_USER' added to docker group. Log out and back in to apply.${NC}"
    fi

    # Start and enable Docker
    $SUDO systemctl start docker
    $SUDO systemctl enable docker

    echo -e "${GREEN}✓ Docker installed successfully${NC}"
fi

# Verify Docker Compose
if docker compose version &> /dev/null; then
    echo -e "${GREEN}✓ Docker Compose is available${NC}"
else
    echo -e "${RED}✗ Docker Compose not found. Please reinstall Docker.${NC}"
    exit 1
fi

###############################################################################
# STEP 3: Configure Firewall
###############################################################################
print_step "STEP 3/6: Configuring Firewall"

echo -e "${YELLOW}→ Configuring UFW firewall...${NC}"
$SUDO ufw --force reset > /dev/null 2>&1 || true
$SUDO ufw default deny incoming
$SUDO ufw default allow outgoing
$SUDO ufw allow ssh
$SUDO ufw allow 80/tcp    # HTTP
$SUDO ufw allow 443/tcp   # HTTPS
$SUDO ufw allow 81/tcp    # Nginx Proxy Manager Admin
$SUDO ufw allow 9443/tcp  # Portainer HTTPS
$SUDO ufw --force enable

echo -e "${GREEN}✓ Firewall configured (SSH, HTTP, HTTPS, NPM Admin, Portainer)${NC}"

###############################################################################
# STEP 4: Generate Configuration
###############################################################################
print_step "STEP 4/6: Generating Configuration"

# Ask for domain
echo ""
echo -e "${YELLOW}Enter your domain name (e.g., moveo-bv.nl):${NC}"
read -p "Domain [moveo-bv.nl]: " DOMAIN
DOMAIN=${DOMAIN:-moveo-bv.nl}

# Ask for admin email
echo ""
echo -e "${YELLOW}Enter admin email for the CMS:${NC}"
read -p "Admin Email [admin@${DOMAIN}]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-admin@${DOMAIN}}

# Generate secrets
generate_secret() {
    openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64
}

JWT_SECRET=$(generate_secret)
DB_PASSWORD=$(generate_secret | tr -d '/+=' | head -c 24)
NPM_DB_PASSWORD=$(generate_secret | tr -d '/+=' | head -c 24)
ADMIN_PASSWORD="Admin123!"

# Create .env file
cat > .env <<EOF
###############################################################################
# Moveo CMS Configuration - Generated $(date)
###############################################################################

# Domain
DOMAIN=${DOMAIN}

# Database
POSTGRES_USER=moveo
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=moveo_cms
DATABASE_URL=postgresql://moveo:${DB_PASSWORD}@postgres:5432/moveo_cms

# JWT Authentication
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# Site Settings
SITE_NAME=Moveo BV
NODE_ENV=production
PORT=4000

# Admin Account (first run only)
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_NAME=Administrator

# Redis
REDIS_URL=redis://redis:6379

# Nginx Proxy Manager Database
NPM_DB_PASSWORD=${NPM_DB_PASSWORD}
EOF

echo -e "${GREEN}✓ Configuration file (.env) created${NC}"

###############################################################################
# STEP 5: Create Directory Structure
###############################################################################
print_step "STEP 5/6: Setting Up Directories"

mkdir -p backend/uploads
mkdir -p data/portainer
mkdir -p data/npm/data
mkdir -p data/npm/letsencrypt
mkdir -p data/npm/mysql

echo -e "${GREEN}✓ Directory structure created${NC}"

###############################################################################
# STEP 6: Build and Start Services
###############################################################################
print_step "STEP 6/6: Building and Starting Services"

echo -e "${YELLOW}→ Building Docker images... (this may take 5-10 minutes)${NC}"
docker compose build --no-cache

echo -e "${YELLOW}→ Starting all services...${NC}"
docker compose up -d

# Wait for services to be healthy
echo ""
echo -e "${YELLOW}→ Waiting for services to start...${NC}"
MAX_RETRIES=90
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    # Check if backend is healthy
    BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' moveo-backend-1 2>/dev/null || echo "starting")
    if [ "$BACKEND_HEALTH" = "healthy" ]; then
        break
    fi
    RETRY=$((RETRY + 1))
    echo -n "."
    sleep 2
done
echo ""

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}⚠ Services might still be starting. Check with: docker compose logs${NC}"
else
    echo -e "${GREEN}✓ All services are running!${NC}"
fi

###############################################################################
# Installation Complete
###############################################################################
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            INSTALLATION COMPLETE!                            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                     ACCESS INFORMATION${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}Server IP:${NC}              ${SERVER_IP}"
echo -e "  ${YELLOW}Domain:${NC}                 ${DOMAIN}"
echo ""
echo -e "  ${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "  ${BLUE}│${NC} ${CYAN}Moveo CMS${NC}                                                 ${BLUE}│${NC}"
echo -e "  ${BLUE}├─────────────────────────────────────────────────────────────┤${NC}"
echo -e "  ${BLUE}│${NC}  Website:       http://${SERVER_IP}:8080                       ${BLUE}│${NC}"
echo -e "  ${BLUE}│${NC}  Admin Panel:   http://${SERVER_IP}:8080/admin                ${BLUE}│${NC}"
echo -e "  ${BLUE}│${NC}  Email:         ${ADMIN_EMAIL}                                 ${BLUE}│${NC}"
echo -e "  ${BLUE}│${NC}  Password:      ${ADMIN_PASSWORD}                                       ${BLUE}│${NC}"
echo -e "  ${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "  ${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "  ${BLUE}│${NC} ${CYAN}Nginx Proxy Manager${NC} (Domain & SSL Management)             ${BLUE}│${NC}"
echo -e "  ${BLUE}├─────────────────────────────────────────────────────────────┤${NC}"
echo -e "  ${BLUE}│${NC}  Admin Panel:   http://${SERVER_IP}:81                         ${BLUE}│${NC}"
echo -e "  ${BLUE}│${NC}  Email:         admin@example.com                             ${BLUE}│${NC}"
echo -e "  ${BLUE}│${NC}  Password:      changeme                                      ${BLUE}│${NC}"
echo -e "  ${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "  ${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
echo -e "  ${BLUE}│${NC} ${CYAN}Portainer${NC} (Docker Management)                              ${BLUE}│${NC}"
echo -e "  ${BLUE}├─────────────────────────────────────────────────────────────┤${NC}"
echo -e "  ${BLUE}│${NC}  Admin Panel:   https://${SERVER_IP}:9443                      ${BLUE}│${NC}"
echo -e "  ${BLUE}│${NC}  Create admin account on first visit                          ${BLUE}│${NC}"
echo -e "  ${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                     NEXT STEPS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}1.${NC} Point your domain DNS (A record) to: ${SERVER_IP}"
echo ""
echo -e "  ${YELLOW}2.${NC} Configure Nginx Proxy Manager:"
echo -e "     - Go to http://${SERVER_IP}:81"
echo -e "     - Login with default credentials (change them!)"
echo -e "     - Add Proxy Host:"
echo -e "       Domain: ${DOMAIN}"
echo -e "       Forward Hostname: nginx"
echo -e "       Forward Port: 80"
echo -e "       Enable SSL with Let's Encrypt"
echo ""
echo -e "  ${YELLOW}3.${NC} Login to Moveo CMS and change admin password"
echo ""
echo -e "  ${YELLOW}4.${NC} Create Portainer admin account at https://${SERVER_IP}:9443"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}                     USEFUL COMMANDS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${YELLOW}View logs:${NC}       docker compose logs -f"
echo -e "  ${YELLOW}Stop services:${NC}   docker compose down"
echo -e "  ${YELLOW}Start services:${NC}  docker compose up -d"
echo -e "  ${YELLOW}Rebuild:${NC}         docker compose up -d --build"
echo -e "  ${YELLOW}Status:${NC}          docker compose ps"
echo ""
echo -e "${RED}⚠ IMPORTANT: Change all default passwords after first login!${NC}"
echo ""

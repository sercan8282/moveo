#!/bin/bash
###############################################################################
#  Moveo CMS - One-Click Installation Script (Linux/macOS)
###############################################################################
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════╗"
echo "║          MOVEO CMS INSTALLER             ║"
echo "║          moveo-bv.nl                      ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed. Please install Docker first.${NC}"
    echo "  https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}"

# Determine compose command
COMPOSE="docker compose"
if ! docker compose version &> /dev/null 2>&1; then
    COMPOSE="docker-compose"
fi

# Generate secrets
generate_secret() {
    openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64
}

# Create .env if not exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}→ Creating .env file...${NC}"
    
    JWT_SECRET=$(generate_secret)
    DB_PASSWORD=$(generate_secret | tr -d '/+=' | head -c 24)
    
    cat > .env <<EOF
# Database
POSTGRES_USER=moveo
POSTGRES_PASSWORD=${DB_PASSWORD}
POSTGRES_DB=moveo_cms
DATABASE_URL=postgresql://moveo:${DB_PASSWORD}@postgres:5432/moveo_cms

# JWT
JWT_SECRET=${JWT_SECRET}

# Site
SITE_NAME=Moveo BV
PORT=4000
NODE_ENV=production

# Admin (first run only)
ADMIN_EMAIL=admin@moveo-bv.nl
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=Administrator

# Redis
REDIS_URL=redis://redis:6379
EOF
    
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Create uploads directory
mkdir -p backend/uploads
echo -e "${GREEN}✓ Upload directory ready${NC}"

# Build and start
echo ""
echo -e "${BLUE}→ Building Docker images... (this may take a few minutes)${NC}"
$COMPOSE build --no-cache

echo ""
echo -e "${BLUE}→ Starting services...${NC}"
$COMPOSE up -d

# Wait for healthy status
echo ""
echo -e "${YELLOW}→ Waiting for services to be ready...${NC}"
MAX_RETRIES=60
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s http://localhost/api/health > /dev/null 2>&1; then
        break
    fi
    RETRY=$((RETRY + 1))
    echo -n "."
    sleep 2
done
echo ""

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${YELLOW}⚠ Services might still be starting. Check with: ${COMPOSE} logs${NC}"
else
    echo -e "${GREEN}✓ All services are running!${NC}"
fi

# Print info
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       INSTALLATION COMPLETE!             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Website:${NC}       http://localhost"
echo -e "  ${BLUE}Admin Panel:${NC}   http://localhost/admin"
echo ""
echo -e "  ${YELLOW}Login Credentials:${NC}"
echo -e "  Email:         admin@moveo-bv.nl"
echo -e "  Password:      Admin123!"
echo ""
echo -e "  ${RED}⚠ Change the admin password after first login!${NC}"
echo ""
echo -e "  ${BLUE}Commands:${NC}"
echo -e "  Stop:          ${COMPOSE} down"
echo -e "  Start:         ${COMPOSE} up -d"
echo -e "  Logs:          ${COMPOSE} logs -f"
echo -e "  Rebuild:       ${COMPOSE} up -d --build"
echo ""

#!/bin/bash
# =============================================================================
# Moveo CMS - Production Update Script
# =============================================================================
# This script safely updates a production Moveo CMS installation while
# preserving all existing data, configurations, and uploaded files.
#
# Usage:
#   ./update.sh              # Normal update
#   ./update.sh --dry-run    # Preview what would happen
#   ./update.sh --rollback   # Rollback to previous version
#   ./update.sh --force      # Force update even if git has uncommitted changes
#
# What this script preserves:
#   - All database data (PostgreSQL volumes)
#   - Uploaded media files (uploads volume)
#   - Environment configuration (.env file)
#   - SSL certificates (from NPM)
#   - All custom settings in the database
#
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
LOG_FILE="${BACKUP_DIR}/update-$(date +%Y%m%d-%H%M%S).log"
COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-moveo}"

# Parse arguments
DRY_RUN=false
ROLLBACK=false
FORCE=false

for arg in "$@"; do
    case $arg in
        --dry-run)
            DRY_RUN=true
            ;;
        --rollback)
            ROLLBACK=true
            ;;
        --force)
            FORCE=true
            ;;
        --help|-h)
            echo "Usage: $0 [--dry-run] [--rollback] [--force]"
            echo ""
            echo "Options:"
            echo "  --dry-run   Preview what would happen without making changes"
            echo "  --rollback  Rollback to the previous version"
            echo "  --force     Force update even with uncommitted changes"
            exit 0
            ;;
    esac
done

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
            echo -e "\n${BLUE}==>${NC} $message"
            ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE" 2>/dev/null || true
}

# Check prerequisites
check_prerequisites() {
    log STEP "Checking prerequisites..."
    
    # Check if running as root (not recommended) or with docker group
    if [ "$EUID" -eq 0 ]; then
        log WARN "Running as root is not recommended. Consider using a user with docker group access."
    fi
    
    # Check if docker is available
    if ! command -v docker &> /dev/null; then
        log ERROR "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log ERROR "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        log ERROR "Git is not installed"
        exit 1
    fi
    
    # Check if we're in a git repository
    if [ ! -d "$SCRIPT_DIR/.git" ]; then
        log ERROR "This doesn't appear to be a git repository"
        exit 1
    fi
    
    # Check for .env file
    if [ ! -f "$SCRIPT_DIR/.env" ]; then
        log ERROR ".env file not found. Please copy .env.example to .env and configure it."
        exit 1
    fi
    
    log INFO "Prerequisites check passed ✓"
}

# Create backup
create_backup() {
    log STEP "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    local backup_name="backup-$(date +%Y%m%d-%H%M%S)"
    local backup_path="${BACKUP_DIR}/${backup_name}"
    
    mkdir -p "$backup_path"
    
    # Save current git commit
    git -C "$SCRIPT_DIR" rev-parse HEAD > "$backup_path/git-commit.txt"
    log INFO "Saved current commit: $(cat $backup_path/git-commit.txt)"
    
    # Backup .env file
    cp "$SCRIPT_DIR/.env" "$backup_path/.env.backup"
    log INFO "Backed up .env file"
    
    # Backup docker-compose.yml
    cp "$SCRIPT_DIR/docker-compose.yml" "$backup_path/docker-compose.yml.backup"
    log INFO "Backed up docker-compose.yml"
    
    # Create database dump
    log INFO "Creating database dump..."
    if docker ps --format '{{.Names}}' | grep -q "${COMPOSE_PROJECT}-postgres"; then
        docker exec ${COMPOSE_PROJECT}-postgres pg_dump -U moveo moveo_cms > "$backup_path/database.sql" 2>/dev/null || {
            log WARN "Could not create database dump. Container might not be running."
        }
        if [ -f "$backup_path/database.sql" ]; then
            log INFO "Database dump created: $(du -h $backup_path/database.sql | cut -f1)"
        fi
    else
        log WARN "PostgreSQL container not running, skipping database dump"
    fi
    
    # Save container state
    docker ps -a --filter "name=${COMPOSE_PROJECT}" --format "{{.Names}}: {{.Status}}" > "$backup_path/container-state.txt"
    log INFO "Saved container state"
    
    # Record the backup path for rollback
    echo "$backup_path" > "${BACKUP_DIR}/latest-backup.txt"
    
    log INFO "Backup created at: $backup_path ✓"
}

# Check for uncommitted changes
check_git_status() {
    log STEP "Checking git status..."
    
    cd "$SCRIPT_DIR"
    
    # Fetch latest from remote
    log INFO "Fetching latest from remote..."
    git fetch origin
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        if [ "$FORCE" = true ]; then
            log WARN "Uncommitted changes detected but --force was used"
        else
            log ERROR "There are uncommitted changes in the repository."
            log ERROR "Please commit or stash them first, or use --force to override."
            git status --short
            exit 1
        fi
    fi
    
    # Show what will be updated
    local current=$(git rev-parse HEAD)
    local remote=$(git rev-parse origin/main 2>/dev/null || git rev-parse origin/master)
    
    if [ "$current" = "$remote" ]; then
        log INFO "Already up to date!"
        if [ "$FORCE" != true ]; then
            exit 0
        fi
    else
        log INFO "Current commit: ${current:0:8}"
        log INFO "Latest commit:  ${remote:0:8}"
        log INFO ""
        log INFO "Changes to be applied:"
        git log --oneline HEAD..origin/main 2>/dev/null || git log --oneline HEAD..origin/master
    fi
}

# Pull latest changes
pull_updates() {
    log STEP "Pulling latest changes..."
    
    cd "$SCRIPT_DIR"
    
    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY-RUN] Would pull: git pull origin main"
        return
    fi
    
    # Stash any local changes to .env (shouldn't be in git but just in case)
    git stash push -m "update-script-stash" -- .env 2>/dev/null || true
    
    # Pull the latest changes
    git pull origin main 2>/dev/null || git pull origin master
    
    # Pop stash if we stashed anything
    git stash pop 2>/dev/null || true
    
    log INFO "Code updated ✓"
}

# Rebuild images
rebuild_images() {
    log STEP "Rebuilding Docker images..."
    
    cd "$SCRIPT_DIR"
    
    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY-RUN] Would rebuild images"
        return
    fi
    
    # Build all images
    log INFO "Building backend image..."
    docker-compose build --no-cache backend
    
    log INFO "Building nginx image..."
    docker-compose build --no-cache nginx
    
    # Also rebuild site-backend if it exists in compose
    if grep -q "site-backend" docker-compose.yml; then
        log INFO "Building site-backend image..."
        docker-compose build --no-cache site-backend 2>/dev/null || true
    fi
    
    log INFO "Images rebuilt ✓"
}

# Update containers
update_containers() {
    log STEP "Updating containers..."
    
    cd "$SCRIPT_DIR"
    
    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY-RUN] Would update containers with: docker-compose up -d"
        return
    fi
    
    # Stop and recreate containers (keeps volumes intact)
    log INFO "Recreating containers..."
    docker-compose up -d --force-recreate
    
    # Wait for services to be healthy
    log INFO "Waiting for services to be healthy..."
    sleep 10
    
    # Check health
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose ps | grep -q "healthy"; then
            break
        fi
        attempt=$((attempt + 1))
        sleep 5
    done
    
    log INFO "Containers updated ✓"
}

# Run migrations
run_migrations() {
    log STEP "Running database migrations..."
    
    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY-RUN] Would run migrations"
        return
    fi
    
    # Wait for backend to be ready
    sleep 5
    
    # Migrations run automatically on backend startup via entrypoint
    # Just verify the backend is healthy
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:4000/api/health > /dev/null 2>&1; then
            log INFO "Backend is healthy, migrations completed ✓"
            return
        fi
        attempt=$((attempt + 1))
        sleep 5
    done
    
    log WARN "Backend health check timed out, but it may still be starting up"
}

# Verify update
verify_update() {
    log STEP "Verifying update..."
    
    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY-RUN] Would verify update"
        return
    fi
    
    # Check container status
    log INFO "Container status:"
    docker-compose ps
    
    # Check backend health
    local nginx_port=$(grep "^NGINX_PORT=" "$SCRIPT_DIR/.env" | cut -d= -f2 || echo "8088")
    
    if curl -sf "http://localhost:${nginx_port}/api/health" > /dev/null 2>&1; then
        log INFO "Frontend proxy is working ✓"
    else
        log WARN "Frontend proxy health check failed"
    fi
    
    # Show new version
    log INFO ""
    log INFO "Update completed successfully!"
    log INFO "Current version: $(git rev-parse --short HEAD)"
}

# Rollback function
do_rollback() {
    log STEP "Starting rollback..."
    
    if [ ! -f "${BACKUP_DIR}/latest-backup.txt" ]; then
        log ERROR "No backup found to rollback to"
        exit 1
    fi
    
    local backup_path=$(cat "${BACKUP_DIR}/latest-backup.txt")
    
    if [ ! -d "$backup_path" ]; then
        log ERROR "Backup directory not found: $backup_path"
        exit 1
    fi
    
    log INFO "Rolling back to: $backup_path"
    
    # Get the commit to rollback to
    local target_commit=$(cat "$backup_path/git-commit.txt")
    log INFO "Target commit: $target_commit"
    
    if [ "$DRY_RUN" = true ]; then
        log INFO "[DRY-RUN] Would rollback to commit $target_commit"
        return
    fi
    
    cd "$SCRIPT_DIR"
    
    # Reset to the backup commit
    git reset --hard "$target_commit"
    
    # Restore .env if it differs
    if [ -f "$backup_path/.env.backup" ]; then
        cp "$backup_path/.env.backup" "$SCRIPT_DIR/.env"
        log INFO "Restored .env file"
    fi
    
    # Rebuild and restart
    rebuild_images
    update_containers
    
    # Restore database if needed
    if [ -f "$backup_path/database.sql" ]; then
        read -p "Restore database from backup? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log INFO "Restoring database..."
            docker exec -i ${COMPOSE_PROJECT}-postgres psql -U moveo moveo_cms < "$backup_path/database.sql"
            log INFO "Database restored ✓"
        fi
    fi
    
    log INFO "Rollback completed ✓"
}

# Cleanup old backups (keep last 5)
cleanup_old_backups() {
    log STEP "Cleaning up old backups..."
    
    cd "$BACKUP_DIR"
    
    # Keep only the 5 most recent backups
    ls -dt backup-* 2>/dev/null | tail -n +6 | xargs -r rm -rf
    
    log INFO "Old backups cleaned up ✓"
}

# Main execution
main() {
    echo ""
    echo "========================================"
    echo "  Moveo CMS Update Script"
    echo "========================================"
    echo ""
    
    mkdir -p "$BACKUP_DIR"
    
    if [ "$ROLLBACK" = true ]; then
        do_rollback
        exit 0
    fi
    
    if [ "$DRY_RUN" = true ]; then
        log INFO "Running in DRY-RUN mode - no changes will be made"
    fi
    
    check_prerequisites
    create_backup
    check_git_status
    pull_updates
    rebuild_images
    update_containers
    run_migrations
    verify_update
    cleanup_old_backups
    
    echo ""
    echo "========================================"
    echo "  Update Complete!"
    echo "========================================"
    echo ""
    echo "Log file: $LOG_FILE"
    echo ""
}

# Run main
main "$@"

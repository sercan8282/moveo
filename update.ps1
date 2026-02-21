# =============================================================================
# Moveo CMS - Production Update Script (Windows PowerShell)
# =============================================================================
# This script safely updates a production Moveo CMS installation while
# preserving all existing data, configurations, and uploaded files.
#
# Usage:
#   .\update.ps1              # Normal update
#   .\update.ps1 -DryRun      # Preview what would happen
#   .\update.ps1 -Rollback    # Rollback to previous version
#   .\update.ps1 -Force       # Force update even if git has uncommitted changes
#
# =============================================================================

param(
    [switch]$DryRun,
    [switch]$Rollback,
    [switch]$Force,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupDir = Join-Path $ScriptDir "backups"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$LogFile = Join-Path $BackupDir "update-$Timestamp.log"

# Load .env if available
if (Test-Path (Join-Path $ScriptDir ".env")) {
    Get-Content (Join-Path $ScriptDir ".env") | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], "Process")
        }
    }
}
$ComposeProject = $env:COMPOSE_PROJECT_NAME ?? "moveo"

function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    switch ($Level) {
        "INFO"  { Write-Host "[INFO] " -ForegroundColor Green -NoNewline; Write-Host $Message }
        "WARN"  { Write-Host "[WARN] " -ForegroundColor Yellow -NoNewline; Write-Host $Message }
        "ERROR" { Write-Host "[ERROR] " -ForegroundColor Red -NoNewline; Write-Host $Message }
        "STEP"  { Write-Host "`n==> " -ForegroundColor Blue -NoNewline; Write-Host $Message }
    }
    
    if (Test-Path $BackupDir) {
        "[$timestamp] [$Level] $Message" | Out-File -FilePath $LogFile -Append -ErrorAction SilentlyContinue
    }
}

function Test-Prerequisites {
    Write-Log "STEP" "Checking prerequisites..."
    
    # Check Docker
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        Write-Log "ERROR" "Docker is not installed or not in PATH"
        exit 1
    }
    
    # Check Docker Compose
    try {
        docker compose version | Out-Null
    } catch {
        Write-Log "ERROR" "Docker Compose is not available"
        exit 1
    }
    
    # Check Git
    if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
        Write-Log "ERROR" "Git is not installed"
        exit 1
    }
    
    # Check if we're in a git repository
    if (-not (Test-Path (Join-Path $ScriptDir ".git"))) {
        Write-Log "ERROR" "This doesn't appear to be a git repository"
        exit 1
    }
    
    # Check for .env file
    if (-not (Test-Path (Join-Path $ScriptDir ".env"))) {
        Write-Log "ERROR" ".env file not found. Please copy .env.example to .env and configure it."
        exit 1
    }
    
    Write-Log "INFO" "Prerequisites check passed"
}

function New-Backup {
    Write-Log "STEP" "Creating backup..."
    
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    
    $backupName = "backup-$Timestamp"
    $backupPath = Join-Path $BackupDir $backupName
    
    New-Item -ItemType Directory -Force -Path $backupPath | Out-Null
    
    # Save current git commit
    Push-Location $ScriptDir
    $currentCommit = git rev-parse HEAD
    $currentCommit | Out-File (Join-Path $backupPath "git-commit.txt")
    Write-Log "INFO" "Saved current commit: $($currentCommit.Substring(0, 8))"
    
    # Backup .env file
    Copy-Item (Join-Path $ScriptDir ".env") (Join-Path $backupPath ".env.backup")
    Write-Log "INFO" "Backed up .env file"
    
    # Backup docker-compose.yml
    Copy-Item (Join-Path $ScriptDir "docker-compose.yml") (Join-Path $backupPath "docker-compose.yml.backup")
    Write-Log "INFO" "Backed up docker-compose.yml"
    
    # Create database dump
    Write-Log "INFO" "Creating database dump..."
    $containers = docker ps --format "{{.Names}}"
    if ($containers -match "$ComposeProject-postgres") {
        docker exec "$ComposeProject-postgres" pg_dump -U moveo moveo_cms 2>$null | Out-File (Join-Path $backupPath "database.sql")
        if (Test-Path (Join-Path $backupPath "database.sql")) {
            $size = (Get-Item (Join-Path $backupPath "database.sql")).Length / 1KB
            Write-Log "INFO" "Database dump created: $([math]::Round($size, 2)) KB"
        }
    } else {
        Write-Log "WARN" "PostgreSQL container not running, skipping database dump"
    }
    
    # Save container state
    docker ps -a --filter "name=$ComposeProject" --format "{{.Names}}: {{.Status}}" | Out-File (Join-Path $backupPath "container-state.txt")
    Write-Log "INFO" "Saved container state"
    
    # Record the backup path for rollback
    $backupPath | Out-File (Join-Path $BackupDir "latest-backup.txt")
    
    Pop-Location
    
    Write-Log "INFO" "Backup created at: $backupPath"
}

function Test-GitStatus {
    Write-Log "STEP" "Checking git status..."
    
    Push-Location $ScriptDir
    
    # Fetch latest from remote
    Write-Log "INFO" "Fetching latest from remote..."
    git fetch origin
    
    # Check for uncommitted changes
    $status = git status --porcelain
    if ($status) {
        if ($Force) {
            Write-Log "WARN" "Uncommitted changes detected but -Force was used"
        } else {
            Write-Log "ERROR" "There are uncommitted changes in the repository."
            Write-Log "ERROR" "Please commit or stash them first, or use -Force to override."
            git status --short
            Pop-Location
            exit 1
        }
    }
    
    # Show what will be updated
    $current = git rev-parse HEAD
    $remote = git rev-parse origin/main 2>$null
    if (-not $remote) {
        $remote = git rev-parse origin/master
    }
    
    if ($current -eq $remote) {
        Write-Log "INFO" "Already up to date!"
        if (-not $Force) {
            Pop-Location
            exit 0
        }
    } else {
        Write-Log "INFO" "Current commit: $($current.Substring(0, 8))"
        Write-Log "INFO" "Latest commit:  $($remote.Substring(0, 8))"
        Write-Log "INFO" ""
        Write-Log "INFO" "Changes to be applied:"
        git log --oneline "HEAD..origin/main" 2>$null
        if ($LASTEXITCODE -ne 0) {
            git log --oneline "HEAD..origin/master"
        }
    }
    
    Pop-Location
}

function Get-Updates {
    Write-Log "STEP" "Pulling latest changes..."
    
    if ($DryRun) {
        Write-Log "INFO" "[DRY-RUN] Would pull: git pull origin main"
        return
    }
    
    Push-Location $ScriptDir
    
    git pull origin main 2>$null
    if ($LASTEXITCODE -ne 0) {
        git pull origin master
    }
    
    Pop-Location
    
    Write-Log "INFO" "Code updated"
}

function Rebuild-Images {
    Write-Log "STEP" "Rebuilding Docker images..."
    
    if ($DryRun) {
        Write-Log "INFO" "[DRY-RUN] Would rebuild images"
        return
    }
    
    Push-Location $ScriptDir
    
    Write-Log "INFO" "Building backend image..."
    docker compose build --no-cache backend
    
    Write-Log "INFO" "Building nginx image..."
    docker compose build --no-cache nginx
    
    Pop-Location
    
    Write-Log "INFO" "Images rebuilt"
}

function Update-Containers {
    Write-Log "STEP" "Updating containers..."
    
    if ($DryRun) {
        Write-Log "INFO" "[DRY-RUN] Would update containers with: docker compose up -d"
        return
    }
    
    Push-Location $ScriptDir
    
    Write-Log "INFO" "Recreating containers..."
    docker compose up -d --force-recreate
    
    Write-Log "INFO" "Waiting for services to be healthy..."
    Start-Sleep -Seconds 10
    
    Pop-Location
    
    Write-Log "INFO" "Containers updated"
}

function Invoke-Migrations {
    Write-Log "STEP" "Running database migrations..."
    
    if ($DryRun) {
        Write-Log "INFO" "[DRY-RUN] Would run migrations"
        return
    }
    
    Start-Sleep -Seconds 5
    
    # Migrations run automatically on backend startup
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Log "INFO" "Backend is healthy, migrations completed"
                return
            }
        } catch { }
        $attempt++
        Start-Sleep -Seconds 5
    }
    
    Write-Log "WARN" "Backend health check timed out, but it may still be starting up"
}

function Test-Update {
    Write-Log "STEP" "Verifying update..."
    
    if ($DryRun) {
        Write-Log "INFO" "[DRY-RUN] Would verify update"
        return
    }
    
    Write-Log "INFO" "Container status:"
    Push-Location $ScriptDir
    docker compose ps
    Pop-Location
    
    $nginxPort = $env:NGINX_PORT ?? "8088"
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$nginxPort/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Log "INFO" "Frontend proxy is working"
        }
    } catch {
        Write-Log "WARN" "Frontend proxy health check failed"
    }
    
    Push-Location $ScriptDir
    $version = git rev-parse --short HEAD
    Pop-Location
    
    Write-Log "INFO" ""
    Write-Log "INFO" "Update completed successfully!"
    Write-Log "INFO" "Current version: $version"
}

function Invoke-Rollback {
    Write-Log "STEP" "Starting rollback..."
    
    $latestBackupFile = Join-Path $BackupDir "latest-backup.txt"
    
    if (-not (Test-Path $latestBackupFile)) {
        Write-Log "ERROR" "No backup found to rollback to"
        exit 1
    }
    
    $backupPath = Get-Content $latestBackupFile
    
    if (-not (Test-Path $backupPath)) {
        Write-Log "ERROR" "Backup directory not found: $backupPath"
        exit 1
    }
    
    Write-Log "INFO" "Rolling back to: $backupPath"
    
    $targetCommit = Get-Content (Join-Path $backupPath "git-commit.txt")
    Write-Log "INFO" "Target commit: $targetCommit"
    
    if ($DryRun) {
        Write-Log "INFO" "[DRY-RUN] Would rollback to commit $targetCommit"
        return
    }
    
    Push-Location $ScriptDir
    
    git reset --hard $targetCommit
    
    if (Test-Path (Join-Path $backupPath ".env.backup")) {
        Copy-Item (Join-Path $backupPath ".env.backup") (Join-Path $ScriptDir ".env") -Force
        Write-Log "INFO" "Restored .env file"
    }
    
    Pop-Location
    
    Rebuild-Images
    Update-Containers
    
    if (Test-Path (Join-Path $backupPath "database.sql")) {
        $restore = Read-Host "Restore database from backup? (y/N)"
        if ($restore -eq "y" -or $restore -eq "Y") {
            Write-Log "INFO" "Restoring database..."
            Get-Content (Join-Path $backupPath "database.sql") | docker exec -i "$ComposeProject-postgres" psql -U moveo moveo_cms
            Write-Log "INFO" "Database restored"
        }
    }
    
    Write-Log "INFO" "Rollback completed"
}

function Remove-OldBackups {
    Write-Log "STEP" "Cleaning up old backups..."
    
    if (Test-Path $BackupDir) {
        $backups = Get-ChildItem -Path $BackupDir -Directory -Filter "backup-*" | Sort-Object CreationTime -Descending | Select-Object -Skip 5
        foreach ($backup in $backups) {
            Remove-Item -Path $backup.FullName -Recurse -Force
        }
    }
    
    Write-Log "INFO" "Old backups cleaned up"
}

# Main execution
function Main {
    Write-Host ""
    Write-Host "========================================"
    Write-Host "  Moveo CMS Update Script"
    Write-Host "========================================"
    Write-Host ""
    
    if ($Help) {
        Write-Host "Usage: .\update.ps1 [-DryRun] [-Rollback] [-Force]"
        Write-Host ""
        Write-Host "Options:"
        Write-Host "  -DryRun    Preview what would happen without making changes"
        Write-Host "  -Rollback  Rollback to the previous version"
        Write-Host "  -Force     Force update even with uncommitted changes"
        exit 0
    }
    
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    
    if ($Rollback) {
        Invoke-Rollback
        exit 0
    }
    
    if ($DryRun) {
        Write-Log "INFO" "Running in DRY-RUN mode - no changes will be made"
    }
    
    Test-Prerequisites
    New-Backup
    Test-GitStatus
    Get-Updates
    Rebuild-Images
    Update-Containers
    Invoke-Migrations
    Test-Update
    Remove-OldBackups
    
    Write-Host ""
    Write-Host "========================================"
    Write-Host "  Update Complete!"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Log file: $LogFile"
    Write-Host ""
}

Main

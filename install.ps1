###############################################################################
#  Moveo CMS - One-Click Installation Script (Windows PowerShell)
###############################################################################

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║          MOVEO CMS INSTALLER             ║" -ForegroundColor Blue
Write-Host "║          moveo-bv.nl                      ║" -ForegroundColor Blue
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Check Docker
try {
    $null = docker --version
    Write-Host "✓ Docker found" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "  https://docs.docker.com/desktop/install/windows-install/"
    exit 1
}

# Check Docker Compose
try {
    $null = docker compose version
    $COMPOSE = "docker compose"
    Write-Host "✓ Docker Compose found" -ForegroundColor Green
} catch {
    try {
        $null = docker-compose version
        $COMPOSE = "docker-compose"
        Write-Host "✓ Docker Compose found" -ForegroundColor Green
    } catch {
        Write-Host "✗ Docker Compose is not installed." -ForegroundColor Red
        exit 1
    }
}

# Generate secrets
function New-Secret {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return [Convert]::ToBase64String($bytes)
}

function New-Password {
    $bytes = New-Object byte[] 18
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $str = [Convert]::ToBase64String($bytes) -replace '[/+=]', ''
    return $str.Substring(0, [Math]::Min(24, $str.Length))
}

# Create .env
if (-not (Test-Path ".env")) {
    Write-Host "→ Creating .env file..." -ForegroundColor Yellow

    $jwtSecret = New-Secret
    $dbPassword = New-Password
    $npmDbPassword = New-Password

    $envContent = @"
###############################################################################
# Moveo CMS Configuration - Generated $(Get-Date)
###############################################################################

# Domain
DOMAIN=localhost

# Database
POSTGRES_USER=moveo
POSTGRES_PASSWORD=$dbPassword
POSTGRES_DB=moveo_cms
DATABASE_URL=postgresql://moveo:${dbPassword}@postgres:5432/moveo_cms

# JWT Authentication
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d

# Site Settings
SITE_NAME=Moveo BV
NODE_ENV=production
PORT=4000

# Admin Account (first run only)
ADMIN_EMAIL=admin@moveo-bv.nl
ADMIN_PASSWORD=Admin123!
ADMIN_NAME=Administrator

# Redis
REDIS_URL=redis://redis:6379

# Nginx Proxy Manager Database
NPM_DB_PASSWORD=$npmDbPassword
"@

    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Create uploads and data directories
@("backend\uploads", "data\portainer", "data\npm\data", "data\npm\letsencrypt", "data\npm\mysql") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}
Write-Host "✓ Directories ready" -ForegroundColor Green

# Build and start
Write-Host ""
Write-Host "→ Building Docker images... (this may take a few minutes)" -ForegroundColor Blue

$composeArgs = $COMPOSE.Split(" ")
if ($composeArgs[0] -eq "docker") {
    & docker compose build --no-cache
    Write-Host ""
    Write-Host "→ Starting services..." -ForegroundColor Blue
    & docker compose up -d
} else {
    & docker-compose build --no-cache
    Write-Host ""
    Write-Host "→ Starting services..." -ForegroundColor Blue
    & docker-compose up -d
}

# Wait for health
Write-Host ""
Write-Host "→ Waiting for services to be ready..." -ForegroundColor Yellow
$maxRetries = 90
$retry = 0
while ($retry -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) { break }
    } catch { }
    $retry++
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
}
Write-Host ""

if ($retry -eq $maxRetries) {
    Write-Host "⚠ Services might still be starting. Check with: $COMPOSE logs" -ForegroundColor Yellow
} else {
    Write-Host "✓ All services are running!" -ForegroundColor Green
}

# Print info
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║            INSTALLATION COMPLETE!                            ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "                     ACCESS INFORMATION" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Moveo CMS:" -ForegroundColor Yellow
Write-Host "    Website:       http://localhost:8080"
Write-Host "    Admin Panel:   http://localhost:8080/admin"
Write-Host "    Email:         admin@moveo-bv.nl"
Write-Host "    Password:      Admin123!"
Write-Host ""
Write-Host "  Nginx Proxy Manager:" -ForegroundColor Yellow
Write-Host "    Admin Panel:   http://localhost:81"
Write-Host "    Email:         admin@example.com"
Write-Host "    Password:      changeme"
Write-Host ""
Write-Host "  Portainer (Docker Management):" -ForegroundColor Yellow
Write-Host "    Admin Panel:   https://localhost:9443"
Write-Host "    Create admin account on first visit"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "                     USEFUL COMMANDS" -ForegroundColor Cyan  
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "  View logs:       $COMPOSE logs -f"
Write-Host "  Stop:            $COMPOSE down"
Write-Host "  Start:           $COMPOSE up -d"
Write-Host "  Rebuild:         $COMPOSE up -d --build"
Write-Host ""
Write-Host "  ⚠ IMPORTANT: Change all default passwords after first login!" -ForegroundColor Red
Write-Host ""

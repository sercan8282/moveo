# Multi-Site Deployment Guide

Dit document beschrijft hoe je meerdere Moveo CMS sites op één server kunt draaien.

## Aanpak: Gescheiden Docker Stacks

**Aanbevolen methode**: Elke site krijgt zijn eigen Docker Compose stack met unieke poorten en container namen. Nginx Proxy Manager routeert de verschillende domeinen naar de juiste backend.

### Voordelen
- ✅ Volledige isolatie tussen sites
- ✅ Onafhankelijke updates per site
- ✅ Aparte databases per site
- ✅ Makkelijke backup/restore per site
- ✅ Eenvoudige configuratie met Nginx Proxy Manager

### Nadelen
- ⚠️ Meer resource gebruik (elke site eigen DB + Redis)
- ⚠️ Meerdere codebases om te beheren

---

## Stap-voor-Stap Setup

### 1. Clone het project voor elke site

```bash
# Site 1 (origineel)
cd /home/user
git clone https://github.com/jouw-repo/moveo.git site1

# Site 2
git clone https://github.com/jouw-repo/moveo.git site2

# Site 3
git clone https://github.com/jouw-repo/moveo.git site3
```

### 2. Maak per site een `.env` bestand

Elke site heeft unieke poorten en container namen nodig.

**Site 1 - `/home/user/site1/.env`:**
```env
# Project identity
COMPOSE_PROJECT_NAME=site1
SITE_NAME=Site 1

# Ports (external:internal)
NGINX_PORT=8081
BACKEND_PORT=3001
POSTGRES_PORT=5433

# Database
DATABASE_URL=postgresql://moveo:moveo_secret_1@postgres:5432/moveo
POSTGRES_PASSWORD=moveo_secret_1

# Security
JWT_SECRET=site1-jwt-secret-change-this-in-production
SESSION_SECRET=site1-session-secret-change-this
```

**Site 2 - `/home/user/site2/.env`:**
```env
COMPOSE_PROJECT_NAME=site2
SITE_NAME=Site 2

NGINX_PORT=8082
BACKEND_PORT=3002
POSTGRES_PORT=5434

DATABASE_URL=postgresql://moveo:moveo_secret_2@postgres:5432/moveo
POSTGRES_PASSWORD=moveo_secret_2

JWT_SECRET=site2-jwt-secret-change-this-in-production
SESSION_SECRET=site2-session-secret-change-this
```

**Site 3 - `/home/user/site3/.env`:**
```env
COMPOSE_PROJECT_NAME=site3
SITE_NAME=Site 3

NGINX_PORT=8083
BACKEND_PORT=3003
POSTGRES_PORT=5435

DATABASE_URL=postgresql://moveo:moveo_secret_3@postgres:5432/moveo
POSTGRES_PASSWORD=moveo_secret_3

JWT_SECRET=site3-jwt-secret-change-this-in-production
SESSION_SECRET=site3-session-secret-change-this
```

### 3. Update `docker-compose.yml` om variabelen te gebruiken

Vervang de hardcoded poorten met environment variabelen:

```yaml
version: '3.8'

services:
  nginx:
    build:
      context: .
      dockerfile: nginx/Dockerfile
    container_name: ${COMPOSE_PROJECT_NAME}-nginx
    ports:
      - "${NGINX_PORT:-8088}:80"
    depends_on:
      backend:
        condition: service_healthy
    volumes:
      - ./backend/uploads:/var/www/uploads:ro
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ${COMPOSE_PROJECT_NAME}-backend
    ports:
      - "${BACKEND_PORT:-3000}:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/uploads:/app/uploads
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  postgres:
    image: postgres:16-alpine
    container_name: ${COMPOSE_PROJECT_NAME}-postgres
    environment:
      - POSTGRES_DB=moveo
      - POSTGRES_USER=moveo
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-moveo_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U moveo -d moveo"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: ${COMPOSE_PROJECT_NAME}-redis
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    networks:
      - app-network

networks:
  app-network:
    name: ${COMPOSE_PROJECT_NAME}-network

volumes:
  postgres_data:
    name: ${COMPOSE_PROJECT_NAME}-postgres-data
```

### 4. Start elke site

```bash
# Site 1
cd /home/user/site1
docker-compose up -d

# Site 2
cd /home/user/site2
docker-compose up -d

# Site 3
cd /home/user/site3
docker-compose up -d
```

### 5. Controleer de containers

```bash
docker ps
```

Je zou moeten zien:
- `site1-nginx`, `site1-backend`, `site1-postgres`, `site1-redis`
- `site2-nginx`, `site2-backend`, `site2-postgres`, `site2-redis`
- `site3-nginx`, `site3-backend`, `site3-postgres`, `site3-redis`

---

## Nginx Proxy Manager Configuratie

### Setup Proxy Hosts

Voor elke site maak je een Proxy Host in Nginx Proxy Manager:

#### Site 1: www.site1.nl
| Setting | Value |
|---------|-------|
| Domain Names | `www.site1.nl`, `site1.nl` |
| Scheme | `http` |
| Forward Hostname/IP | `site1-nginx` of `172.17.0.1` |
| Forward Port | `8081` |
| Block Common Exploits | ✅ |
| Websockets Support | ✅ |

#### Site 2: www.site2.nl
| Setting | Value |
|---------|-------|
| Domain Names | `www.site2.nl`, `site2.nl` |
| Scheme | `http` |
| Forward Hostname/IP | `site2-nginx` of `172.17.0.1` |
| Forward Port | `8082` |

#### Site 3: www.site3.nl
| Setting | Value |
|---------|-------|
| Domain Names | `www.site3.nl`, `site3.nl` |
| Forward Port | `8083` |

### SSL Certificaten

Gebruik "Request a new SSL Certificate" met Let's Encrypt:
- ✅ Force SSL
- ✅ HTTP/2 Support
- ✅ HSTS Enabled

---

## Beheer Scripts

### Start alle sites
```bash
#!/bin/bash
# start-all.sh
for site in site1 site2 site3; do
  echo "Starting $site..."
  cd /home/user/$site && docker-compose up -d
done
```

### Stop alle sites
```bash
#!/bin/bash
# stop-all.sh
for site in site1 site2 site3; do
  echo "Stopping $site..."
  cd /home/user/$site && docker-compose down
done
```

### Update een specifieke site
```bash
#!/bin/bash
# update-site.sh
SITE=$1
if [ -z "$SITE" ]; then
  echo "Usage: ./update-site.sh site1"
  exit 1
fi

cd /home/user/$SITE
git pull
docker-compose build --no-cache
docker-compose up -d
echo "$SITE updated!"
```

### Backup een site
```bash
#!/bin/bash
# backup-site.sh
SITE=$1
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/home/user/backups/$SITE

mkdir -p $BACKUP_DIR

# Backup database
docker exec ${SITE}-postgres pg_dump -U moveo moveo > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czvf $BACKUP_DIR/uploads_$DATE.tar.gz /home/user/$SITE/backend/uploads

echo "Backup completed: $BACKUP_DIR"
```

---

## Resource Planning

| Sites | RAM (aanbevolen) | Disk |
|-------|------------------|------|
| 1-2   | 2 GB             | 20 GB |
| 3-5   | 4 GB             | 40 GB |
| 6-10  | 8 GB             | 80 GB |

### Optimalisaties voor meerdere sites

1. **Deel Redis** (optioneel):
   Gebruik één Redis instance met verschillende databases:
   ```yaml
   # Site 1 uses redis db 0
   REDIS_URL=redis://shared-redis:6379/0
   # Site 2 uses redis db 1
   REDIS_URL=redis://shared-redis:6379/1
   ```

2. **Gebruik Docker Resource Limits**:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 512M
             cpus: '0.5'
   ```

---

## Troubleshooting

### Port al in gebruik
```bash
# Check welke poort bezet is
sudo lsof -i :8081
# Of
sudo netstat -tlnp | grep 8081
```

### Container naam conflict
```bash
# Verwijder oude container
docker rm -f site1-nginx
# Rebuild
docker-compose up -d --force-recreate
```

### Database connectie problemen
```bash
# Test DB verbinding
docker exec -it site1-postgres psql -U moveo -d moveo -c "SELECT 1"
```

### Logs bekijken
```bash
# Alle logs van een site
docker-compose -p site1 logs -f

# Alleen backend logs
docker logs -f site1-backend
```

---

## Alternatief: Multi-Tenancy (Geavanceerd)

Als je veel sites hebt (>10), overweeg dan multi-tenancy in de applicatie zelf:
- Eén database met `site_id` kolom in elke tabel
- Domain-based tenant detection in de backend
- Gedeelde resources met logische scheiding

Dit vereist significante aanpassingen aan de code maar is efficiënter voor grote schaal.

---

## Samenvatting

1. Clone project per site
2. Maak `.env` met unieke poorten
3. Update `docker-compose.yml` voor variabelen
4. Start elke site: `docker-compose up -d`
5. Configureer Nginx Proxy Manager per domein
6. Gebruik SSL via Let's Encrypt

Vragen? Open een issue of contacteer support.

# Moveo CMS

Een compleet, modern Content Management System gebouwd met React, Node.js, en PostgreSQL. Draait volledig in Docker met Nginx Proxy Manager voor SSL en Portainer voor Docker management.

## Features

- **Page Management** — Create and manage pages with a rich text editor (TipTap)
- **Blog/Posts** — Publish blog posts with featured images and SEO fields
- **Media Library** — Upload images with 4 preset sizes (150px, 400px, 800px, 1200px) + custom resize
- **Menu Manager** — Drag & drop menu management for header and 3 footer columns
- **Homepage Builder** — Visual homepage sections (hero, featured, content, CTA) with drag & drop reorder
- **Footer Editor** — 3-column footer with rich text and menu linking, drag & drop columns
- **Theme System** — Color template system with live preview and 4 default themes
- **User Management** — Role-based access control (Super Admin, Admin, Editor, Viewer)
- **MFA / 2FA** — Two-factor authentication with TOTP (Google Authenticator)
- **Multilingual Admin** — Admin panel in Dutch (NL) and English (EN)
- **Responsive** — Fully responsive frontend and admin panel
- **SEO** — Meta title, description, and Open Graph support per page/post

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express + Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Reverse Proxy | Nginx + Nginx Proxy Manager |
| SSL | Let's Encrypt (via NPM) |
| Docker Management | Portainer CE |
| Container | Docker + Docker Compose |

## Quick Start (Linux/Ubuntu)

```bash
# Clone the repository
git clone <repository-url>
cd moveo

# Make installer executable and run
chmod +x install.sh
sudo ./install.sh
```

The installer will automatically:
1. Update the system (`apt update && upgrade`)
2. Install Docker and Docker Compose
3. Configure UFW firewall
4. Generate secure secrets and create `.env`
5. Build all Docker images
6. Start all services (Moveo CMS, Nginx Proxy Manager, Portainer)
7. Display access URLs and credentials

### Windows (Development)
```powershell
.\install.ps1
```

## Access After Installation

| Service | URL | Description |
|---------|-----|-------------|
| **Moveo CMS** | `http://SERVER_IP:8080` | Main website |
| **Moveo Admin** | `http://SERVER_IP:8080/admin` | CMS admin panel |
| **Nginx Proxy Manager** | `http://SERVER_IP:81` | Domain & SSL management |
| **Portainer** | `https://SERVER_IP:9443` | Docker management |

### Default Credentials

**Moveo CMS Admin:**
- Email: `admin@moveo-bv.nl`
- Password: `Admin123!`

**Nginx Proxy Manager:**
- Email: `admin@example.com`
- Password: `changeme`

**Portainer:** Create admin account on first visit

> ⚠️ **IMPORTANT:** Change all default passwords after first login!

## Domain & SSL Setup

1. Point your domain's DNS A record to your server IP
2. Open Nginx Proxy Manager: `http://SERVER_IP:81`
3. Login and change default credentials
4. Add new Proxy Host:
   - **Domain:** your-domain.com
   - **Forward Hostname:** nginx
   - **Forward Port:** 80
   - **SSL:** Request new SSL certificate with Let's Encrypt

## Architecture

```
moveo/
├── docker-compose.yml      # Service orchestration
├── .env                    # Environment variables (generated)
├── install.sh              # Linux/Mac installer
├── install.ps1             # Windows installer
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf          # Reverse proxy config
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma   # Database models
│   │   ├── seed.js         # Initial data
│   │   └── migrations/
│   └── src/
│       ├── index.js        # Express server
│       ├── config/
│       ├── middleware/      # Auth, roles
│       ├── routes/          # API endpoints
│       └── utils/           # Image processing, helpers
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx          # Router
        ├── api/             # Axios client
        ├── context/         # Auth, Language, Theme
        ├── components/      # Shared (RichTextEditor, MediaLibrary, AdminLayout)
        ├── admin/           # Admin pages
        ├── public/          # Public pages
        └── i18n/            # Translations (NL/EN)
```

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| npm | 80, 443, 81 | Nginx Proxy Manager (reverse proxy, SSL) |
| npm-db | internal | MariaDB for NPM |
| portainer | 9443 | Docker management UI |
| nginx | 8080 | Moveo frontend + reverse proxy to backend |
| backend | 4000 (internal) | Moveo API server |
| postgres | 5432 (internal) | PostgreSQL database |
| redis | 6379 (internal) | Redis cache |

## Commands

```bash
# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f

# Rebuild after changes
docker compose up -d --build

# Reset database
docker compose down -v
docker compose up -d
```

## Updating (Production)

Use the update script to safely update your production installation:

```bash
# Linux/Mac
chmod +x update.sh
./update.sh

# Windows
.\update.ps1
```

### Update Options

| Option | Description |
|--------|-------------|
| `--dry-run` / `-DryRun` | Preview what would happen without making changes |
| `--rollback` / `-Rollback` | Rollback to the previous version |
| `--force` / `-Force` | Force update even if git has uncommitted changes |

### What the Update Script Does

1. **Creates backup** — Saves current git commit, .env, docker-compose.yml, and database dump
2. **Checks git status** — Ensures no uncommitted changes
3. **Pulls latest code** — From the remote repository
4. **Rebuilds images** — Rebuilds all Docker images without cache
5. **Updates containers** — Recreates containers while preserving volumes
6. **Runs migrations** — Automatically applied via backend startup
7. **Verifies update** — Checks container and health status

### What is Preserved

- All database data (PostgreSQL volumes)
- Uploaded media files (uploads volume)
- Environment configuration (.env file)
- SSL certificates (from NPM)
- All custom settings in the database

### Rollback

If something goes wrong, rollback to the previous version:

```bash
# Linux
./update.sh --rollback

# Windows
.\update.ps1 -Rollback
```

Backups are stored in the `backups/` directory. The last 5 backups are kept automatically.

## Multi-Site Management

The Moveo CMS supports managing multiple websites from a single installation. Each site runs in its own isolated Docker stack with:

- Dedicated PostgreSQL database
- Dedicated Redis cache
- Dedicated Backend API
- Dedicated Nginx proxy
- Shared Nginx Proxy Manager (for SSL/domains)
- Shared Portainer (for Docker management)

### Creating a New Site

1. Go to Admin Panel → Site Management (Super Admin only)
2. Click "New Site"
3. Enter site name and slug (slug becomes the internal prefix, e.g. `demo-backend`)
4. Click "Deploy"
5. Wait for all containers to start (~1-2 minutes)
6. Credentials (admin login, database) will be shown in a modal — save these!

### Accessing Sub-Sites

Each sub-site backend runs on a dynamic port. View the port in:
- Site Management → site card shows port
- Portainer → container details
- `docker ps` command

To access the admin panel of a sub-site:
```
http://SERVER_IP:PORT/admin
```

### Connecting Domains to Sub-Sites

1. Open Nginx Proxy Manager
2. Add new Proxy Host
3. Domain: `clientsite.com`
4. Forward Hostname: `{slug}-nginx` (e.g., `demo-nginx`)
5. Forward Port: `80`
6. Enable SSL with Let's Encrypt

### Adding Existing Site to Multi-Site System

If you have an existing Moveo site and want to add it to the multi-site management system:

1. **Export database from existing site:**
   ```bash
   docker exec moveo-postgres pg_dump -U moveo moveo_cms > existing-site-backup.sql
   ```

2. **Export uploaded media:**
   ```bash
   docker cp moveo-backend:/app/uploads ./existing-uploads
   ```

3. **Create new site via Site Manager** (see above)

4. **Import database to new site:**
   ```bash
   # Get the new site's postgres container name
   docker exec -i {slug}-postgres psql -U moveo moveo_cms < existing-site-backup.sql
   ```

5. **Copy uploads to new site:**
   ```bash
   docker cp ./existing-uploads/. {slug}-backend:/app/uploads/
   ```

6. **Restart the backend:**
   ```bash
   docker restart {slug}-backend
   ```

### Site Stack Architecture

Each sub-site creates these containers:

| Container | Purpose |
|-----------|---------|
| `{slug}-postgres` | PostgreSQL 16 database |
| `{slug}-redis` | Redis 7 cache |
| `{slug}-backend` | Node.js API server |
| `{slug}-nginx` | Nginx reverse proxy |
| `{slug}-npm` | Nginx Proxy Manager |
| `{slug}-npm-db` | MariaDB for NPM |
| `{slug}-portainer` | Portainer (optional, can be shared) |

## User Roles

| Role | Pages | Posts | Media | Users | Settings | Themes |
|------|-------|-------|-------|-------|----------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Viewer | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ❌ |

## License

Private — Moveo BV

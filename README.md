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

## User Roles

| Role | Pages | Posts | Media | Users | Settings | Themes |
|------|-------|-------|-------|-------|----------|--------|
| Super Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Viewer | 👁️ | 👁️ | 👁️ | ❌ | ❌ | ❌ |

## License

Private — Moveo BV

# Moveo CMS

Een compleet, modern Content Management System gebouwd met React, Node.js, en PostgreSQL. Draait volledig in Docker.

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
| Reverse Proxy | Nginx |
| Container | Docker + Docker Compose |

## Quick Start

### Windows
```powershell
.\install.ps1
```

### Linux / macOS
```bash
chmod +x install.sh
./install.sh
```

The installer will:
1. Generate secure secrets and create `.env`
2. Build all Docker images
3. Start all services
4. Run database migrations and seed data
5. Display login credentials

## Access

| URL | Description |
|-----|-------------|
| `http://localhost` | Public website |
| `http://localhost/admin` | Admin panel |

### Default Login
- **Email:** `admin@moveo-bv.nl`
- **Password:** `Admin123!`

> ⚠️ Change the admin password after first login!

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
| nginx | 80 | Reverse proxy |
| backend | 4000 (internal) | API server |
| postgres | 5432 (internal) | Database |
| redis | 6379 (internal) | Cache |

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

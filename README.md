# Inviora - Wedding Invitation Management Platform

A production-ready platform for creating and managing personalized digital wedding invitations.

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui (base-ui)
- React Hook Form + Zod
- TanStack React Query
- Axios

### Backend
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Cloudinary (image storage)
- Winston (logging)

## Prerequisites

- Node.js 18+
- PostgreSQL
- Cloudinary account

## Getting Started

### 1. Clone and install

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database and Cloudinary credentials
npm install

# Frontend
cd ../frontend
cp .env.example .env.local
npm install
```

### 2. Set up database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Start development servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000 (atau port di `.env`)

## Deployment

Lihat **[DEPLOYMENT.md](./DEPLOYMENT.md)** untuk panduan lengkap deploy ke production.

**Rekomendasi stack:**
- Frontend → **Vercel**
- Backend → **Railway** atau **Render**
- Database → **Neon** (PostgreSQL)
- Media → **Cloudinary**


### Backend (.env)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT tokens (min 16 chars) |
| `JWT_EXPIRES_IN` | Token expiration (e.g. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `PORT` | API server port (default: 4000) |
| `CORS_ORIGIN` | Frontend URL (default: http://localhost:3000) |

### Frontend (.env.local)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:4000/api) |

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user (auth required)

Public self-registration is disabled. Create accounts via CLI or admin API.

### Admin (ADMIN role only)
- `POST /api/admin/users` - Create user account
- `GET /api/admin/users` - List users (`?role=EVENT_OWNER`)

### Wedding Events
- `POST /api/weddings` - Create event (ADMIN only, requires `ownerUserId`)
- `GET /api/weddings` - List events (ADMIN: all, EVENT_OWNER: assigned only)
- `GET /api/weddings/:id` - Get event
- `PATCH /api/weddings/:id` - Update event
- `DELETE /api/weddings/:id` - Delete event (ADMIN only)

## User Roles

| Role | Access |
|------|--------|
| `ADMIN` | Create/delete events, manage users, access all events |
| `EVENT_OWNER` | Manage assigned event only (guests, template, media) |

### Create accounts (CLI)

```bash
cd backend

# Create admin
npm run create-user -- --email admin@example.com --name "Admin" --password yourpassword --role ADMIN

# Create event owner
npm run create-user -- --email owner@example.com --name "Event Owner" --password yourpassword --role EVENT_OWNER
```

Run database migration after pulling:

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Guests (auth required + ownership)
- `GET /api/weddings/:weddingId/guests` - List guests
- `POST /api/weddings/:weddingId/guests` - Add guest
- `PATCH /api/weddings/:weddingId/guests/:guestId` - Update guest
- `DELETE /api/weddings/:weddingId/guests/:guestId` - Delete guest
- `POST /api/weddings/:weddingId/guests/import` - CSV import
- `POST /api/weddings/:weddingId/guests/import/preview` - CSV preview

### Template (auth required + ownership)
- `GET /api/weddings/:weddingId/template` - Get config
- `PATCH /api/weddings/:weddingId/template` - Update config

### Media (auth required + ownership)
- `GET /api/weddings/:weddingId/media` - List media
- `POST /api/weddings/:weddingId/media` - Upload image
- `DELETE /api/weddings/:weddingId/media/:mediaId` - Delete image

### Public Invitation (no auth)
- `GET /api/public/invitations/:eventSlug/:guestToken` - Get invitation data

## Testing

```bash
cd backend
npm test
```

## Project Structure

```
inviora/
├── backend/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── middleware/    # auth, authorize, validate, upload, errorHandler
│       ├── modules/      # auth, wedding, guest, template, media, invitation
│       ├── services/     # prisma, cloudinary
│       ├── utils/        # logger, apiResponse, token, slug, errors
│       ├── __tests__/    # security tests
│       ├── app.ts
│       └── index.ts
├── frontend/
│   └── src/
│       ├── app/          # Next.js pages
│       ├── components/
│       │   ├── ui/       # shadcn/ui components
│       │   ├── wedding/  # domain components
│       │   └── templates/# invitation templates
│       ├── lib/          # api client, auth context, providers
│       └── types/
└── README.md
```

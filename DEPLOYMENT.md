# Panduan Deployment Inviora

Platform undangan pernikahan ini terdiri dari **2 layanan terpisah**:

| Komponen | Teknologi | Rekomendasi hosting |
|----------|-----------|---------------------|
| Frontend | Next.js 16 | **Vercel** |
| Backend API | Express + Prisma | **Railway** atau **Render** |
| Database | PostgreSQL | **Neon** (paling mudah) |
| Media/Gambar | Cloudinary | **Cloudinary** (sudah terintegrasi) |

> **Kenapa tidak semua di Vercel?**  
> Backend Inviora adalah server Express yang berjalan terus-menerus (long-running). Vercel dirancang untuk frontend dan serverless functions. Express + Prisma + upload file lebih stabil di Railway/Render.

---

## Rekomendasi Database: **Neon**

Untuk project ini, **Neon** adalah pilihan termudah:

| Kriteria | Neon | Supabase | Railway Postgres |
|----------|------|----------|------------------|
| Gratis | ✅ Generous free tier | ✅ Free tier | ✅ $5 credit/bulan |
| Prisma | ✅ Native support | ✅ Native support | ✅ Native support |
| Serverless-friendly | ✅ Connection pooling | ✅ Pooling via Supavisor | ⚠️ Perlu config |
| Setup | ⭐ Paling cepat | Sedang (lebih banyak fitur) | Mudah jika pakai Railway full-stack |

### Cara setup Neon (5 menit)

1. Daftar di [neon.tech](https://neon.tech)
2. Buat project baru → region terdekat (Singapore/Tokyo)
3. Copy **Connection string** (pooled) → ini adalah `DATABASE_URL`
4. Paste ke environment variable backend

Format connection string:
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/inviora?sslmode=require
```

> Gunakan **pooled connection** untuk production (hostname mengandung `-pooler`).

---

## Checklist Sebelum Deploy

### Akun yang perlu disiapkan

- [ ] [GitHub](https://github.com) — source code
- [ ] [Vercel](https://vercel.com) — frontend
- [ ] [Railway](https://railway.app) atau [Render](https://render.com) — backend
- [ ] [Neon](https://neon.tech) — PostgreSQL database
- [ ] [Cloudinary](https://cloudinary.com) — upload gambar undangan

### Environment variables

#### Backend (`backend/.env`)

| Variable | Contoh production | Wajib |
|----------|-------------------|-------|
| `DATABASE_URL` | `postgresql://...@neon.tech/inviora?sslmode=require` | ✅ |
| `JWT_SECRET` | Random string min 32 karakter | ✅ |
| `JWT_EXPIRES_IN` | `7d` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `PORT` | `4000` (Railway/Render set otomatis via `PORT`) | ✅ |
| `CORS_ORIGIN` | `https://inviora.vercel.app` | ✅ |
| `CLOUDINARY_CLOUD_NAME` | dari dashboard Cloudinary | ✅ |
| `CLOUDINARY_API_KEY` | dari dashboard Cloudinary | ✅ |
| `CLOUDINARY_API_SECRET` | dari dashboard Cloudinary | ✅ |

> `CORS_ORIGIN` mendukung beberapa URL dipisah koma:
> `https://inviora.vercel.app,https://inviora-git-main.vercel.app`

#### Frontend (`frontend/.env`)

| Variable | Contoh production | Wajib |
|----------|-------------------|-------|
| `NEXT_PUBLIC_API_URL` | `https://inviora-api.up.railway.app/api` | ✅ |

### Generate JWT_SECRET

```bash
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# atau Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Langkah Deploy (Termudah)

### Step 1 — Push ke GitHub

Repo sudah disiapkan di folder `inviora/`. Pastikan tidak ada file `.env` yang ter-commit.

### Step 2 — Setup Database (Neon)

1. Buat database di Neon
2. Copy connection string
3. Jalankan migrasi dari komputer lokal (sekali saja):

```bash
cd backend
# Set DATABASE_URL ke Neon connection string
npx prisma migrate deploy
```

### Step 3 — Deploy Backend (Railway)

1. Login [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Pilih repo `inviora`
3. **Settings** → **Root Directory** = `backend`
4. **Variables** → tambahkan semua env backend (lihat tabel di atas)
5. Deploy otomatis berjalan. Catat URL publik, misalnya:
   `https://inviora-api-production.up.railway.app`
6. Test: buka `https://your-api-url/api/health`

Railway akan menjalankan:
- Build: `npm install --include=dev && npm run build && npm prune --omit=dev`
- Start: `npm run start:prod` (migrate + start server)

### Step 4 — Deploy Frontend (Vercel)

1. Login [vercel.com](https://vercel.com) → **Add New Project**
2. Import repo GitHub `inviora`
3. **Root Directory** = `frontend`
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://your-api-url/api`
5. Deploy

### Step 5 — Update CORS

Kembali ke Railway backend, update:
```
CORS_ORIGIN=https://your-app.vercel.app
```
Redeploy backend setelah mengubah CORS.

### Step 6 — Buat Admin Pertama

Setelah backend live, buat admin via Railway shell atau lokal dengan `DATABASE_URL` production:

```bash
cd backend
npm run create-user -- --email admin@you.com --name "Admin" --password YourSecurePass123 --role ADMIN
```

---

## Alternatif: Render (Backend + DB)

File `render.yaml` sudah disediakan di root repo. Connect repo di Render → **New Blueprint** → pilih `render.yaml`.

Render akan membuat:
- Web service `inviora-api` (backend)
- PostgreSQL database `inviora-db`

Anda masih perlu set manual: `CORS_ORIGIN` dan credential Cloudinary.

---

## Custom Domain (Opsional)

| Layanan | Domain contoh |
|---------|---------------|
| Vercel | `inviora.com` → frontend |
| Railway | `api.inviora.com` → backend |

Setelah custom domain:
1. Update `NEXT_PUBLIC_API_URL` di Vercel
2. Update `CORS_ORIGIN` di backend

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| CORS error di browser | Pastikan `CORS_ORIGIN` exact match URL frontend (termasuk `https://`) |
| `Invalid environment variables` | Cek `JWT_SECRET` min 16 karakter, `DATABASE_URL` valid |
| Prisma migration gagal | Jalankan `npx prisma migrate deploy` dengan `DATABASE_URL` production |
| Upload gambar gagal | Verifikasi 3 variable Cloudinary di backend |
| API 404 di Vercel | Backend harus di Railway/Render, bukan Vercel |
| Login gagal production | Pastikan `NEXT_PUBLIC_API_URL` mengarah ke `/api` backend |

---

## Arsitektur Production

```
┌─────────────┐     HTTPS      ┌──────────────┐
│   Browser   │ ──────────────▶│    Vercel    │
│             │                │  (Next.js)   │
└─────────────┘                └──────┬───────┘
       │                              │
       │  NEXT_PUBLIC_API_URL         │
       ▼                              ▼
┌─────────────┐     Prisma     ┌──────────────┐
│  Cloudinary │◀── uploads ────│   Railway    │
│   (images)  │                │  (Express)   │
└─────────────┘                └──────┬───────┘
                                      │
                                      ▼
                               ┌──────────────┐
                               │     Neon     │
                               │ (PostgreSQL) │
                               └──────────────┘
```

---

## Estimasi Biaya (Free Tier)

| Layanan | Free tier | Catatan |
|---------|-----------|---------|
| Vercel | ✅ Hobby free | Cukup untuk project personal |
| Neon | ✅ 0.5 GB storage | Cukup untuk ribuan event |
| Railway | $5 credit/bulan | Monitor usage |
| Render | ✅ Free web + DB | Sleep setelah idle (lambat wake-up) |
| Cloudinary | ✅ 25 credits/bulan | Cukup untuk development & small prod |

Untuk production serius dengan traffic tinggi, pertimbangkan upgrade Neon + Railway Pro.

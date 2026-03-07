# Kexing Deployment Guide

## Cloud Deployment (no local install for users)

### 1) Deploy backend to Render/Railway
- Service root: `server`
- Start command: `npm run dev`
- Required env:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `CORS_ORIGIN` (frontend domain, comma-separated if multiple)
  - `AI_PROVIDER` (`mock` by default, reserved for openai/deepseek)

### 2) Deploy frontend to Vercel
- Project root: `client`
- Env:
  - `NEXT_PUBLIC_API_URL=https://<your-backend-domain>/api`

### 3) MongoDB Atlas
- Create cluster
- Add network allowlist
- Create database user
- Put connection string to backend `MONGODB_URI`

## Offline Package
- Run `build_offline_zip.bat`
- Output: `release/kexing_offline_package.zip`
- End users can run `start_offline_no_install.bat` (embedded DB mode)

## Notes
- Image uploads are stored under `/uploads` in backend runtime.
- In cloud production, recommend replacing local uploads with object storage.
- Admin Excel import endpoint: `POST /api/admin/import/courses?preview=true|false`.

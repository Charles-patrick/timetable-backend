# Timetable System — Backend API

Express + Node.js REST API for the Online Timetable Generating System.
MongoDB (Mongoose) for the database, JWT (httpOnly cookie) for authentication.

---

## 1. Requirements

- Node.js v18 or higher
- npm
- A MongoDB database — either:
  - **MongoDB Atlas** (recommended, free tier, doesn't require anything installed locally), or
  - A local MongoDB instance

---

## 2. Project Structure

```
timetable-backend/
├─ src/
│  ├─ modules/
│  │  ├─ auth/            → login, logout, /me
│  │  └─ users/            → User model (admin + lecturer)
│  ├─ middleware/
│  │  ├─ auth.middleware.js   → verifyToken, requireRole
│  │  └─ errorHandler.js      → centralized error responses
│  ├─ config/
│  │  └─ db.js             → MongoDB connection
│  └─ app.js                → Express app, CORS, route mounting
├─ scripts/
│  └─ seedAdmin.js          → creates the first admin account
├─ server.js                 → entry point
├─ .env.example
└─ package.json
```

More modules (Courses, Lecturers, Venues, Time Slots, Sessions, Timetable, Admin) will be added here the same way — one folder per feature under `src/modules/`.

---

## 3. Setup Instructions

### Step 1 — Install dependencies

```bash
cd timetable-backend
npm install
```

### Step 2 — Get a MongoDB connection string

If using MongoDB Atlas (recommended):

1. Go to https://www.mongodb.com/cloud/atlas and create a free account/cluster.
2. Under **Database Access**, create a database user with a username and password.
3. Under **Network Access**, add your IP (or `0.0.0.0/0` for development, to allow access from anywhere).
4. Click **Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Add a database name before the `?`, e.g. `.../timetable-system?retryWrites=true...`

### Step 3 — Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and fill in the real values:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/timetable-system

JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:3000

ADMIN_NAME=System Admin
ADMIN_EMAIL=admin@timetable.edu
ADMIN_PASSWORD=ChangeThisPassword123!
```

**Notes:**
- `JWT_SECRET` — any long random string. You can generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `FRONTEND_URL` — must exactly match where your Next.js frontend runs (CORS will block requests from anywhere else).
- `ADMIN_*` — used only once, by the seed script below, to create your first login.

### Step 4 — Create the first admin account

There is no public signup page by design. Run this once:

```bash
npm run seed:admin
```

You should see:
```
Admin created successfully: admin@timetable.edu
```

Run this again later with different `ADMIN_*` values in `.env` if you ever need another admin — it will skip creation if that email already exists.

### Step 5 — Start the server

Development (auto-restarts on file changes):
```bash
npm run dev
```

Production:
```bash
npm start
```

You should see:
```
MongoDB connected: cluster0-shard-xxxxx.mongodb.net
Server running on http://localhost:5000
```

### Step 6 — Confirm it's working

```bash
curl http://localhost:5000/api/v1/health
```
Expected response:
```json
{"success":true,"message":"API is running"}
```

Test login with the admin account you seeded:
```bash
curl -i -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@timetable.edu","password":"ChangeThisPassword123!"}'
```
A successful response includes a `Set-Cookie: token=...` header and:
```json
{"success":true,"message":"Login successful","data":{"user":{...}}}
```

---

## 4. Environment Variables Reference

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default `5000`) |
| `NODE_ENV` | `development` or `production` — affects cookie security settings |
| `MONGODB_URI` | Full MongoDB connection string, including database name |
| `JWT_SECRET` | Secret used to sign/verify JWTs — keep private, never commit |
| `JWT_EXPIRES_IN` | How long a login session lasts (e.g. `7d`) |
| `FRONTEND_URL` | Exact origin of the Next.js frontend, used for CORS |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used once by `npm run seed:admin` |

---

## 5. Deployment Notes

- Deploy this backend separately from the frontend (e.g. Render or Railway).
- Set all the same environment variables in your host's dashboard — don't upload `.env`.
- Set `NODE_ENV=production` in production — this switches the auth cookie to `secure: true, sameSite: "none"`, required for cross-domain cookies to work between the frontend and backend.
- Update `FRONTEND_URL` to your deployed frontend's real URL (e.g. `https://your-app.vercel.app`).
- Update `MONGODB_URI` Network Access in Atlas to allow your hosting provider's IPs (or `0.0.0.0/0`).

---

## 6. Common Issues

| Problem | Fix |
|---|---|
| `MONGODB_URI is not set in the environment` | You haven't created `.env`, or forgot to fill in `MONGODB_URI` |
| Login works via curl/Postman but not from the frontend | Check `FRONTEND_URL` matches your frontend's exact origin, and that frontend requests use `credentials: 'include'` |
| `MongooseServerSelectionError` | Check your Atlas Network Access allows your current IP, and that the password in `MONGODB_URI` doesn't contain unescaped special characters |
| Cookie not being set in the browser | In production, make sure you're on HTTPS on both ends — `secure: true` cookies are rejected over plain HTTP |

# 🌊 FloodGrid — Secure Disaster Relief Coordination Platform

Full-stack project by **Ananya Srivastava** and **Kavya Kushwaha**.
Citizens raise help requests, volunteers accept and deliver them, admins watch stats and an audit log, all with live updates.

## Run (VS Code terminal)
Needs **Node.js 22.5 or newer**. No `npm install` needed (zero dependencies).
```
cd backend
npm start          # open http://localhost:3000   (backend also serves ../frontend)
npm test           # 5 automated API tests
```
Demo accounts (dummy data): `citizen@test.com`, `volunteer@test.com`, `admin@test.com`, password `Test@1234`.
Internet is needed in the browser only for three.js and Google Fonts (CDN). Reset demo data: `npm run seed` (inside `backend`).

## What you get
- **Cinematic intro (v2, ~15 s)**: black → storm clouds you fly down through → the river breaks and a **flood wave** smashes the town (doors burst open, houses tilt and get swept away) → **people stranded on rooftops waving, drowning swimmers going under, glowing HELP / SOS signs** → boat arrives → FLOODGRID title. Captions tell the story. Skip with Esc.
- **Smooth transitions**: camera rides a smooth spline (no jumps), a **water-wipe** covers the screen on Enter / Login / Logout, staggered card entrances, animated KPI count-up, growing bars and donut, button ripples, live-refresh without flicker. Respects `prefers-reduced-motion`.
- **Live dashboards** (Server-Sent Events): a new request appears instantly for volunteers (critical ones trigger a lightning strike).
- **Citizen**: raise requests (validated), track status timeline and assigned volunteer.
- **Volunteer**: urgent-first queue, urgency filter, Accept (atomic, second volunteer gets 409), Mark delivered (only the assigned volunteer).
- **Admin**: Open/Accepted/Delivered/Avg response time, requests by type, status donut, delivery rate, searchable audit log, **CSV export**.
- **Register** new citizen/volunteer accounts. The 3D beacons follow the data (red open, blue accepted, green delivered).

## Structure
```
backend/   index.js (HTTP server)  config.js  package.json  .env.example
  lib/     jwt.js password.js validate.js ratelimit.js http.js auth.js events.js
  routes/  auth.js requests.js admin.js
  db/      schema.sql db.js seed.js   (SQLite: tables, view, trigger, transactions)
  test/    api.test.js
frontend/  index.html  css/ (base, intro, app)  js/ (sound, scene, api, intro, app)
docs/      azure-sql.sql  (T-SQL schema + sp_AcceptRequest + trigger for the Azure part)
```

## Security (viva points)
JWT HS256 with 2 h expiry · scrypt salted password hashing · role-based access on every route · parameterised SQL only (no SQL injection) · input validation + `<>` stripping and output escaping (XSS) · CSP, HSTS, X-Frame-Options and other headers · rate limiting (login brute force: 20 per 15 min) · same-response timing for unknown users · CSV formula-injection guard · audit log incl. failed logins.

## Honest notes
- The app was built without internet, so the server uses Node built-ins + SQLite (`node:sqlite`) instead of Express/bcrypt/Azure SQL. Routes, JWT, hashing, helmet-style headers and rate limiting are implemented by hand and are tested. `docs/azure-sql.sql` has the Azure SQL schema; swapping the DB layer (`server/db/db.js`) to `mssql` is the migration step.
- Set a strong `JWT_SECRET` in `.env` before any real deployment, and serve over HTTPS.
- Planned (not built): NGO role, Blob Storage proof photos, Cosmos DB events, Power BI.

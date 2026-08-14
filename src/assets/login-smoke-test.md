# Smoke-Testing the Login Endpoint (Beginner's Guide)

A **smoke test** is a quick, manual check that the important parts of your app actually work end to end — you "light it up and see if it smokes." We won't write any test code here. We'll start the server and hit the API with `curl` commands from the terminal.

This guide tests the new unified auth:

| Endpoint | Method | What it does |
|---|---|---|
| `/v1/api/auth/register/:userType` | POST | Creates a user (`rider`, `driver`, or `admin`) |
| `/v1/api/auth/login` | POST | Logs in and returns a JWT access token |

---

## 1. Before you start (prerequisites)

You need:

1. **Node.js** installed (`node -v` to check).
2. **PostgreSQL** running locally. The app connects using the values in your `.env` file:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
   - Tip: the app uses `synchronize: true`, so **tables are created automatically** when the server starts. You don't need to create them by hand.
3. **Dependencies installed**: run `npm install` once in the project root (if you haven't already).

> The `.env` file also has SMTP settings, but **you don't need a real email server for this test**. If email sending fails, the app just logs the error and continues (the admin registration will still succeed).

---

## 2. Start the server

In the project root, run:

```bash
npm run start:dev
```

You should see output ending with something like:

```
[Nest] ... Nest application successfully started
```

The server now listens on **http://localhost:3000** (or whatever `PORT` is set to in `.env`).

> Keep this terminal running. Open a **second terminal** for the `curl` commands below.

---

## 3. Step 1 — Create a test user for each type

`curl` sends an HTTP request. `-X POST` sets the method, `-H "Content-Type: application/json"` says the body is JSON, and `-d '...'` is the JSON body itself.

### Rider

```bash
curl -X POST http://localhost:3000/v1/api/auth/register/rider \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@example.com","password":"secret123","phone":"+8801711111111"}'
```

### Driver

```bash
curl -X POST http://localhost:3000/v1/api/auth/register/driver \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Smith","age":30,"email":"john@example.com","password":"secret123"}'
```

### Admin

> Admin passwords must be **8–32 characters** with at least one uppercase letter, one lowercase letter, one number, and one special character.

```bash
curl -X POST http://localhost:3000/v1/api/auth/register/admin \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Boss","lastName":"Admin","email":"boss@example.com","password":"Secret123!","role":"ADMIN"}'
```

**What you should see:** a JSON object with the created user's info (for example `"id"`, `"email"`, `"role"`). **The password will NOT be in the response** — that's intentional.

If you get a `409` response (`"message": "... already exists with this email"`), pick a different email and try again.

---

## 4. Step 2 — Log in as each user

The login body needs the same email/password plus a `userType` field: `"rider"`, `"driver"`, or `"admin"`.

### Rider

```bash
curl -X POST http://localhost:3000/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret123","userType":"rider"}'
```

### Driver

```bash
curl -X POST http://localhost:3000/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"secret123","userType":"driver"}'
```

### Admin

```bash
curl -X POST http://localhost:3000/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"boss@example.com","password":"Secret123!","userType":"admin"}'
```

**What you should see:** a response like this — the `access_token` is the JWT:

```json
{ "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIx...", ... }
```

---

## 5. Step 3 — Look inside the token to see the `role`

A JWT has three parts separated by dots. The **middle part** is the payload (base64-encoded JSON). It should contain `sub` (the user's id), `email`, and **`role`** — this is the claim the client uses to route the user.

**Easy way:** copy the `access_token` into https://jwt.io — the payload is decoded automatically.

**Terminal way:** save a token in a variable, then decode:

```bash
TOKEN="eyJhbGciOi...paste-your-full-token-here..."
echo $TOKEN | cut -d. -f2 | base64 -d
```

**What you should see for each user type:**

| User | Expected `role` value |
|---|---|
| rider | `"rider"` |
| driver | `"driver"` |
| admin | `"ADMIN"` (or `"SUPER_ADMIN"` / `"SUPPORT_AGENT"` if you registered with that role) |

This is how the app knows who you are: **rider/driver/admin roles are different values**, and an admin's role comes from the `role` field used at registration.

---

## 6. Step 4 — Call a protected route with the token

Some routes require authentication (they're protected by `JwtAuthGuard`). Example: `GET /v1/api/admin/admin-list`.

Send the token in the `Authorization` header as a Bearer token:

```bash
curl -X GET http://localhost:3000/v1/api/admin/admin-list \
  -H "Authorization: Bearer $TOKEN"
```

**What you should see (today):** a `200` response with the list of admins — **for any valid token** (rider, driver, or admin).

> ⚠️ **Important:** right now the guard only checks that the token is valid — it does **not** yet check the `role`. That's exactly what the RBAC step (step 5 of the refactor plan) adds. After RBAC is implemented, a rider token hitting an admin route should get `403 Forbidden`, and an admin token should still get `200`.

**What you should see with no token / a bad token:**

```bash
curl -X GET http://localhost:3000/v1/api/admin/admin-list
```

→ `401 Unauthorized` with `{ "message": "Unauthorized", "statusCode": 401 }`.

---

## 7. Step 5 — Test the error cases

These should all fail gracefully:

| Test | Command (body shown) | Expected |
|---|---|---|
| Wrong password | `{"email":"jane@example.com","password":"wrongpass","userType":"rider"}` | `401` — `"Invalid Credentials"` |
| Unknown email | `{"email":"nobody@example.com","password":"secret123","userType":"rider"}` | `401` — `"Invalid Credentials"` |
| Bad userType | `{"email":"jane@example.com","password":"secret123","userType":"robot"}` | `400` — validation error on `userType` |
| Register duplicate | (register the same rider twice) | `409` — `"... already exists with this email"` |
| Protected route, no token | `GET /v1/api/admin/admin-list` | `401 Unauthorized` |

Note: for security, a wrong password and an unknown email return the **same** message (`Invalid Credentials`) so attackers can't tell which one failed.

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `ECONNREFUSED` when starting | Postgres isn't running | Start Postgres, or fix `DB_HOST`/`DB_PORT` in `.env` |
| `Authentication failed` on startup | Wrong `DB_USER`/`DB_PASSWORD` | Check the values in `.env` |
| `curl: (7) Failed to connect` | Server isn't running | Make sure `npm run start:dev` is still running |
| `404` on a route | Wrong URL/prefix | All routes start with `/v1/api/...` |
| `400` validation errors | Body doesn't match the DTO | Check required fields (e.g. admin needs `role`; admin password needs 1 upper, 1 lower, 1 number, 1 special char) |
| Token decodes but shows no `exp` | `JWT_EXPIRES_IN` not set in `.env` | Add it, e.g. `JWT_EXPIRES_IN=1d` |
| Admin register succeeded but no email arrived | SMTP not configured | Expected — the app logs the email error and continues |

---

## Quick recap

1. `npm run start:dev` — start the server.
2. Register a rider, driver, and admin.
3. Log in as each → you get an `access_token`.
4. Decode the token (jwt.io) → see `role` differ per user type.
5. Call a protected route with the token → `200` with any valid token for now, `401` without one.

After the RBAC step is added, repeat step 6 — rider/driver tokens should then get `403` on admin routes.

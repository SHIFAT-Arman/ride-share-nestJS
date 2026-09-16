# RideSharing App (Backend)

---

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

---

Users: Admin, Driver, Rider, Employee

## Authentication

### ADR: Access + refresh tokens (Passport)

**Status:** Accepted

**Context:** We need short-lived API auth and a way to stay logged in without storing passwords in the browser. A single long-lived JWT is hard to revoke. Clearing cookies alone is not enough for logout-everywhere or stolen refresh tokens.

**Decision:**

- **Access token** (`rs_access` cookie): short-lived JWT, Passport strategy `jwt`. Used on normal API routes.
- **Refresh token** (`rs_refresh` cookie): longer-lived JWT, Passport strategy `jwt-refresh`, checked against Postgres (`refresh_tokens`). Used only on `POST /v1/api/auth/refresh`.
- Separate secrets: `JWT_SECRET` vs `JWT_REFRESH_SECRET`.
- On refresh we **rotate** the token (old one dies, new one is issued). Reuse of an old refresh token after rotation revokes that token family (theft signal).
- Re-login revokes all refresh rows for that user (one active session family).
- Cookie names stay `rs_*` so stale localhost `access_token` Secure cookies do not break auth.
- Frontend: on API `401`, silently call refresh once; if that fails, logout and go to `/login`.

**Consequences:** Logout and re-login can invalidate sessions. Refresh needs the DB. Stateless “JWT-only refresh” was rejected because we cannot revoke or detect reuse without a store. Swap the store later (e.g. Redis) via `REFRESH_TOKEN_STORE` without changing guards or route handlers.

## Admin

- Tables

![](src/assets/admin-table.png)

- Admin Routes:
  `AdminController` (`@Controller('/v1/api/admin')`)

| Method   | Route                                   | Guard       |
| -------- | --------------------------------------- | ----------- |
| `GET`    | `/v1/api/admin/admin-list`              | `AuthGuard` |
| `POST`   | `/v1/api/admin/create`                  | None        |
| `PATCH`  | `/v1/api/admin/update-admin/:id`        | None        |
| `PUT`    | `/v1/api/admin/:id/profile-picture`     | None        |
| `GET`    | `/v1/api/admin/get-announcements`       | `AuthGuard` |
| `POST`   | `/v1/api/admin/create-announcement`     | `AuthGuard` |
| `DELETE` | `/v1/api/admin/delete-announcement/:id` | `AuthGuard` |
| `DELETE` | `/v1/api/admin/delete-admin/:id`        | None        |
| `POST`   | `/v1/api/admin/send-email`              | None        |

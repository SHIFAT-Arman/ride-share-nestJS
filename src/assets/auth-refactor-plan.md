# Plan: Unify Auth into a Single RBAC Module

## Goal

One auth module serving all user types (rider, driver, admin) with a **single login endpoint**. The client sends `userType` in the login body, the server validates against the right user table, and issues a JWT whose payload carries `role`. Clients route themselves from that role claim. A shared RBAC guard enforces roles on protected routes.

## Target layout (current state)

```
src/auth/
  auth.module.ts        // ✅ registers JwtModule (global) once
  auth.controller.ts    // ✅ POST /v1/api/auth/login + register routes by access level
  auth.service.ts       // ✅ switch on userType -> lookup -> verify -> sign (+ register)
  roles.guard.ts        // ⬜ pending — RBAC guard (reads @Roles metadata)
  roles.decorator.ts    // ⬜ pending — @Roles('admin', ...)
  jwt-auth.guard.ts     // ✅ shared JWT bearer guard
  user-type.enum.ts     // ✅ RIDER | DRIVER | ADMIN (named user-type.enum.ts)
  dto/login.dto.ts      // ✅ { email, password, userType } — validated
  dto/login.response.ts // ✅ { access_token }
  interfaces/jwt-payload.interface.ts  // ✅ { sub, email, role }
```

## Steps

### 1. Scaffold `src/auth/` module and move shared pieces — ✅ done

- Move `jwt.strategy`/`AuthGuard` (the two identical copies) into `src/auth/jwt-auth.guard.ts`; type the payload with a shared `JwtPayload { sub, email, role }` interface.
- Move `LoginDto` (add `userType` field validated with `@IsEnum(UserType)`) and `LoginResponse` here; delete the duplicated copies in `admin/auth/` and `driver/auth/`.
- Move `PasswordService` (currently under `admin/password/`) into `src/auth/` (or `common/`) — it's already used by both admin and driver auth, so it belongs outside any domain.

### 2. Register `JwtModule` once, globally — ✅ done

- Register `JwtModule.registerAsync({ global: true, ... })` inside `AuthModule` (same secret/expiry config that's duplicated in `AdminModule` and `DriverModule` today) and export it. Remove the two local `JwtModule` registrations.

### 3. Add missing lookups — ✅ done

- `RiderService` has no `findOneByEmail` yet — add one mirroring `DriverService.findOneByEmail`. (`AdminService` and `DriverService` already have theirs.)

### 4. Implement the single login in `AuthService` — ✅ done

- `POST /v1/api/auth/login` with `{ email, password, userType }`.
- Switch on `userType`: call `riderService.findOneByEmail` / `driverService.findOneByEmail` / `adminService.findOneByEmail`.
- Normalize the found record to a common shape and build the role claim:
  - rider → `role: 'rider'`
  - driver → `role: 'driver'`
  - admin → `role: 'admin'`
- Verify password via `PasswordService.verify`, then sign `{ sub: user.id, email, role }`.
- Invalid `userType`, unknown email, or bad password → `UnauthorizedException('Invalid Credentials')`.
- `AuthModule` imports `RiderModule`, `DriverModule`, `AdminModule` (with their services exported) to get the lookups — avoid circular imports by having the domain modules _not_ import `AuthModule` (only use its exported guard).
- Note: a strategy-pattern refactor of the `userType` switch (provider classes + registry) was attempted and **reverted** for readability — the switch was kept.

### 5. Add RBAC — ⬜ remaining (the only unfinished step)

- `roles.decorator.ts`: `@Roles(...roles)` → `SetMetadata('roles', roles)`.
- `roles.guard.ts`: verifies the token (via `JwtAuthGuard`), reads `request.user.role`, and checks it against the route's `@Roles` metadata with `Reflector`.
- Apply `@Roles(...)` to admin-only routes (e.g. the admin controller routes that currently use `AuthGuard`); driver routes get `JwtAuthGuard` only or `@Roles('driver')`.

### 6. Delete the old auth code and rewire — ✅ done

- Remove `src/entities/admin/auth/` and `src/entities/driver/auth/` (controller, service, guard, dto) once the shared module replaces them.
- `AdminModule` / `DriverModule`: drop local `AuthService`, `AuthController`, `AuthGuard`, and the cross-imported `PasswordService`/`EmailService` (moved to `auth/` or `common/`); import `AuthModule` where guards are needed.
- Add `AuthModule` to `AppModule` imports.

### 7. Registration endpoints (decision point) — ✅ done (resolved: explicit auth routes)

- Registration endpoints are explicit: `POST /v1/api/auth/register` (public rider), `POST /v1/api/auth/register/admin` (admin only), and `POST /v1/api/auth/register/driver` (rider/admin).

### 8. Verify — ◐ partial (build + typecheck pass; e2e spec and per-role smoke tests pending — need a DB)

- `npm run build` to catch stale imports, run the e2e spec, then smoke-test login for one account of each type and confirm the `role` claim differs and protected routes reject wrong roles.

## Things to watch

- **Email collisions**: with `userType` sent by the client, no cross-table ambiguity — good.
- **bcrypt vs bcryptjs**: riders/drivers hash with one, `PasswordService` uses the other; both produce compatible hashes for `bcrypt.compare`, so verification works, but worth consolidating later.
- **Role values** are lowercase (`rider`, `driver`, `admin`) and should stay case-exact in `@Roles(...)` checks.

---

# Current Auth-Related File Map (before refactor)

## Auth feature folders (currently duplicated per user type)

**Admin — `src/entities/admin/auth/`** (controller route: `POST /auth/login`, `POST /auth/register`)

```
admin/auth/
├── auth.controller.ts    // @Controller('auth'): register, login
├── auth.service.ts       // login: AdminService.findOneByEmail → PasswordService.verify → sign { sub, role: admin.role }
├── auth.guard.ts         // JWT bearer guard → request['user'] = { sub, email, role }
├── jwt.strategy.ts       // ⚠️ fully commented out (dead file)
├── login.dto.ts          // { email, password }
└── login.response.ts     // { access_token }
```

**Driver — `src/entities/driver/auth/`** (controller route: `POST /driver/auth/login`, `POST /driver/auth/register`)

```
driver/auth/
├── auth.controller.ts    // @Controller('driver/auth'): register, login
├── auth.service.ts       // login: DriverService.findOneByEmail → PasswordService.verify → sign { sub, role: 'driver' }
├── auth.guard.ts         // ⚠️ byte-identical copy of admin's guard
├── login.dto.ts          // ⚠️ identical copy
└── login.response.ts     // ⚠️ identical copy
```

## Misplaced shared services (in `admin/`, used cross-domain)

```
src/entities/admin/
├── password/password.service.ts   // PasswordService — bcrypt hash/verify (SALT_ROUNDS = 10)
├── email/
│   ├── email.service.ts           // EmailService — nodemailer, used by admin auth, driver auth, admin controller
│   └── send-email.dto.ts
└── admin-role.model.ts            // legacy role model (removed in current simplified role set)
```

## JWT module registrations (duplicated, identical config)

- `src/entities/admin/admin.module.ts` — `JwtModule.registerAsync(...)` + providers `[AdminService, PasswordService, AuthService, AuthGuard, EmailService]`
- `src/entities/driver/driver.module.ts` — `JwtModule.registerAsync(...)` + providers `[DriverService, RatingService, VehicleService, EmailService, PasswordService, AuthService]` (note: `RatingService` listed twice)

## Consumers of the auth guards

| File                                       | Uses                                 | Routes protected                                                                               |
| ------------------------------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `src/entities/admin/admin.controller.ts`   | `AuthGuard` from `./auth/auth.guard` | 5 routes (admin-list, get-announcements, create-announcement, delete-announcement, send-email) |
| `src/entities/driver/driver.controller.ts` | `AuthGuard` from `./auth/auth.guard` | 2 routes (create-vehicle, get-all-ratings)                                                     |

## Auth-adjacent support

- **`src/entities/rider/`** — no auth at all. `RiderService` hashes passwords with `bcrypt` (12 rounds) on create, but there's **no `findOneByEmail`** and no login/register.
- **`src/entities/vehicle/`** — `CreateVehicleDto` used by driver's protected `create-vehicle` route.
- **`src/app.module.ts`** — the commented-out `// AuthModule` import; `ConfigModule` provides `JWT_SECRET` / `JWT_EXPIRES_IN` env vars used by both `JwtModule` registrations.

## Quick observations relevant to the refactor

- **3 duplicate file pairs** to delete after consolidation: `auth.guard.ts`, `login.dto.ts`, `login.response.ts` (admin + driver copies).
- **JWT payload mismatch**: guards type the payload as `{ sub, email, role }`, but both `sign()` calls omit `email` — worth normalizing when the single login is built.
- **Rider is the gap**: it needs `findOneByEmail` + a login path before the single login can cover all three user types.

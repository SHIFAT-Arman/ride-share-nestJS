# Ride Share API

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?style=flat&logo=render&logoColor=111111)

The backend API for the [Ride Share frontend](https://github.com/SHIFAT-Arman/ride-share-nextJs). It provides authentication and role-based services for riders, drivers, and administrators, including ride estimates, booking, driver assignment, trip status, ratings, announcements, analytics, and profile pictures.

## Live API

This service is deployed on Render. Set the deployed Render URL here when publishing this README:

```text
https://ride-share-nestjs.onrender.com
```

The public root endpoint (`GET /`) returns a simple response and can be used as a basic deployment check.

## Features

- Cookie-based access and refresh-token authentication
- Refresh-token rotation and server-side token storage
- Role-aware authorization for admin, driver, rider, and employee users
- Rider registration, profile management, ride history, and active-ride tracking
- Driver availability, location updates, ride acceptance, and trip lifecycle controls
- Ride fare estimation, booking, cancellation, completion, and ratings
- Admin management, announcements, FAQs, testimonials, and analytics
- Pusher integration for real-time ride and announcement updates
- Neon Object Storage/S3-compatible storage for profile pictures
- DTO validation with rejected unknown fields and CORS allowlisting

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | NestJS 11 |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | TypeORM |
| Authentication | Passport, JWT, HTTP-only cookies |
| Validation | `class-validator`, `class-transformer` |
| Realtime | Pusher |
| File storage | Neon Object Storage via AWS S3 SDK |
| Hosting | Render |

## API areas

All resource endpoints are prefixed with `/v1/api`.

| Area | Base path |
| --- | --- |
| Authentication | `/v1/api/auth` |
| Admin | `/v1/api/admin` |
| Riders | `/v1/api/riders` |
| Drivers | `/v1/api/drivers` |
| Rides | `/v1/api/ride` |
| Location | `/v1/api/location` |
| Vehicles | `/v1/api/vehicles` |
| FAQs | `/v1/api/faqs` |
| Testimonials | `/v1/api/testimonials` |
| Analytics | `/v1/api/analytics` |

Authentication endpoints include:

- `POST /v1/api/auth/login`
- `POST /v1/api/auth/register`
- `POST /v1/api/auth/refresh`
- `POST /v1/api/auth/logout`
- `GET /v1/api/auth/me`
- `POST /v1/api/auth/switch-role`

Ride endpoints include fare estimation, booking, active/history queries, driver acceptance, start/complete/cancel actions, and ratings. The API uses cookies for browser authentication, so cross-origin clients must send requests with credentials enabled.

## Project structure

```text
src/
├── auth/                 JWT strategies, guards, cookies, and auth routes
├── entities/
│   ├── admin/             Admin management and announcements
│   ├── analytics/         Admin and user analytics
│   ├── driver/            Driver profiles and availability
│   ├── faq/               FAQ management
│   ├── location/          Place search and driver locations
│   ├── ride/              Estimates, trips, and ratings
│   ├── rider/             Rider profiles
│   ├── testimonial/       Testimonial management
│   └── vehicle/           Vehicle data
├── frontend-origins.ts    CORS and cookie-origin validation
├── main.ts                Application bootstrap and middleware
└── typeorm.options.ts     PostgreSQL/TypeORM configuration
test/                      End-to-end test configuration
.env.example               Environment variable template
```

## Frontend

The companion frontend is available at [ride-share-nextJs](https://github.com/SHIFAT-Arman/ride-share-nextJs). Configure its API base URL to point to the Render service and enable credentials on requests so the authentication cookies are sent.

## License

This project is private and currently has no open-source license.

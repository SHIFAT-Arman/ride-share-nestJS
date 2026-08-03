# RideSharing App (Backend)

---

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

---

Users: Admin, Driver, Rider, Employee

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

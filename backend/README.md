# BiteBridge Backend API

Simple guide for running and manually testing the current Express API endpoints mounted in `src/app.ts`.

## Base URL

```text
http://localhost:5000
```

The server uses `process.env.PORT` when set, otherwise it runs on port `5000`.

## Setup

From the `backend` folder:

```bash
npm install
npm run dev
```

Required environment variables in `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-secret"
PORT=5000
```

If the database schema is not ready yet, run Prisma first:

```bash
npm run prisma -- generate
npm run prisma -- db push
```

## Auth

Protected endpoints require this header:

```http
Authorization: Bearer <token>
```

Tokens are returned by `POST /api/auth/register` and `POST /api/auth/login`.

Valid roles are:

```text
CUSTOMER, RESTAURANT, RIDER, ADMIN
```

## Endpoint Summary

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Public | API health/status check |
| POST | `/api/auth/register` | Public | Register a user and receive a JWT |
| POST | `/api/auth/login` | Public | Login and receive a JWT |
| GET | `/api/auth/me` | Any logged-in user | Get the current user |
| GET | `/api/auth/admin-only` | ADMIN | Test admin role access |
| GET | `/api/auth/restaurant-only` | RESTAURANT | Test restaurant role access |
| GET | `/api/auth/rider-only` | RIDER | Test rider role access |
| GET | `/api/restaurants` | Public | List all restaurants |
| POST | `/api/restaurants` | RESTAURANT | Create the logged-in user's restaurant |
| GET | `/api/restaurants/me` | RESTAURANT | Get the logged-in user's restaurant |
| GET | `/api/menu/restaurant/:restaurantId` | Public | List available menu items for a restaurant |
| POST | `/api/menu` | RESTAURANT | Create a menu item for the logged-in user's restaurant |
| GET | `/api/menu/my` | RESTAURANT | List all menu items for the logged-in user's restaurant |
| DELETE | `/api/menu/:id` | RESTAURANT | Delete one of the logged-in user's menu items |

## Example Testing Flow

### 1. Check the API

```bash
curl http://localhost:5000/
```

Expected success response:

```json
{
  "status": 1,
  "message": "Food Ordering API is running"
}
```

### 2. Register a restaurant user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Restaurant Owner",
    "email": "owner@example.com",
    "password": "password123",
    "phone": "255700000001",
    "role": "RESTAURANT"
  }'
```

Copy the returned `data.token` value for protected requests.

### 3. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123"
  }'
```

### 4. Get the current user

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### 5. Create a restaurant

Only a user with role `RESTAURANT` can create a restaurant.

```bash
curl -X POST http://localhost:5000/api/restaurants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "BiteBridge Kitchen",
    "description": "Fresh meals and fast delivery",
    "address": "Dar es Salaam",
    "phone": "255700000002"
  }'
```

Copy the returned `data.id` as the restaurant id.

### 6. List restaurants

```bash
curl http://localhost:5000/api/restaurants
```

### 7. Get my restaurant

```bash
curl http://localhost:5000/api/restaurants/me \
  -H "Authorization: Bearer <token>"
```

### 8. Create a menu item

The logged-in restaurant user must already have a restaurant.

```bash
curl -X POST http://localhost:5000/api/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Chicken Pilau",
    "description": "Spiced rice with tender chicken",
    "price": 12000,
    "isAvailable": true,
    "imageUrl": "https://example.com/chicken-pilau.jpg"
  }'
```

Copy the returned `data.id` as the menu item id.

### 9. Get my menu

```bash
curl http://localhost:5000/api/menu/my \
  -H "Authorization: Bearer <token>"
```

### 10. Get public restaurant menu

```bash
curl http://localhost:5000/api/menu/restaurant/<restaurantId>
```

This only returns items where `isAvailable` is `true`.

### 11. Delete a menu item

```bash
curl -X DELETE http://localhost:5000/api/menu/<menuItemId> \
  -H "Authorization: Bearer <token>"
```

## Role Test Endpoints

Use these to confirm role-based access control:

```bash
curl http://localhost:5000/api/auth/restaurant-only \
  -H "Authorization: Bearer <restaurant-token>"

curl http://localhost:5000/api/auth/admin-only \
  -H "Authorization: Bearer <admin-token>"

curl http://localhost:5000/api/auth/rider-only \
  -H "Authorization: Bearer <rider-token>"
```

If the token role does not match the endpoint requirement, the API returns `403`.

## Common Error Responses

Missing or invalid token:

```json
{
  "status": 0,
  "message": "Unauthorized"
}
```

Wrong role:

```json
{
  "status": 0,
  "message": "Forbidden: You do not have permission to access this resource"
}
```

Validation or business rule errors, such as duplicate email or missing restaurant, return:

```json
{
  "status": 0,
  "message": "Error message here"
}
```

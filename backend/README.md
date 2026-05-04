# BiteBridge Backend API

Simple guide for running and manually testing the current Express API endpoints mounted in `src/app.ts`.

## Base URL

```text
http://localhost:3000
```

When running with Docker, set `PORT=3000` so the Node server listens on the same port exposed by the container.

## Setup

### Run With Docker

Requirements:

- Docker Desktop
- Docker Compose

From a fresh clone, go into the backend folder:

```bash
cd backend
```

Create your development env file:

```bash
cp .env.example .env
```

Update `.env` with your own values. For Docker development, keep `PORT=3000`.

```env
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=your_postgres_database
DATABASE_URL=postgresql://your_postgres_user:your_postgres_password@localhost:5432/your_postgres_database?schema=public
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret
```

The `DATABASE_URL` value in `.env` is useful for local Prisma commands and editor tooling. Docker Compose overrides it inside the app container so the API connects to the internal database service at `db:5432`.

Start the development stack:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This starts:

- `app`: Express API using the Dockerfile `development` stage
- `db`: PostgreSQL 16 Alpine

The API is available at:

```text
http://localhost:3000
```

The database is also exposed locally for tools such as TablePlus, DBeaver, or Prisma Studio:

```text
localhost:5432
```

Stop the stack:

```bash
docker compose -f docker-compose.dev.yml down
```

Stop the stack and remove the development database volume:

```bash
docker compose -f docker-compose.dev.yml down -v
```

Run logs again after the first build:

```bash
docker compose -f docker-compose.dev.yml up
```

Run a command inside the app container:

```bash
docker compose -f docker-compose.dev.yml exec app sh
```

Apply Prisma migrations manually if needed:

```bash
docker compose -f docker-compose.dev.yml exec app npx prisma migrate deploy
```

The app container already runs `npx prisma migrate deploy` before starting.

### Production Compose

Create a production env file:

```bash
cp .env.example .env.production
```

Update `.env.production` with production values. Keep `PORT=3000` unless you also update the Compose port mapping.

Start the production stack:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
```

Use `--env-file .env.production` because Compose variable interpolation happens before `env_file` is applied.

View logs:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
```

Stop production:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

In production Compose, PostgreSQL is not exposed to the host. Only the API port is published.

### Run Locally Without Docker

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

With `PORT=5000`, the local non-Docker API is available at `http://localhost:5000`.

If the database schema is not ready yet, run Prisma first:

```bash
npm run prisma -- generate
npm run prisma -- migrate dev
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
| POST | `/api/orders` | CUSTOMER | Create an order from one restaurant's menu items |
| GET | `/api/orders/my` | CUSTOMER | List the logged-in customer's orders |
| PATCH | `/api/orders/:id/accept` | RESTAURANT | Accept an order for the logged-in user's restaurant |
| PATCH | `/api/orders/:id/prepare` | RESTAURANT | Mark an order as preparing |
| PATCH | `/api/orders/:id/assign` | RIDER | Assign the logged-in rider to an order |
| PATCH | `/api/orders/:id/deliver` | RIDER | Mark an assigned order as delivered |

## Order Status Flow

Orders use these statuses:

```text
PENDING, ACCEPTED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
```

Current endpoint flow:

```text
CUSTOMER creates order -> PENDING
RESTAURANT accepts order -> ACCEPTED
RESTAURANT starts preparing -> PREPARING
RIDER assigns self -> OUT_FOR_DELIVERY
RIDER marks delivered -> DELIVERED
```

Order rules:

- A customer order must contain at least one item.
- All items in one order must come from the same restaurant.
- `totalAmount` is calculated by the API from menu item prices and quantities.
- Restaurant users can accept only orders for their own restaurant.
- Riders can mark delivered only orders assigned to themselves.

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

### 12. Register a customer user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Customer User",
    "email": "customer@example.com",
    "password": "password123",
    "phone": "255700000003",
    "role": "CUSTOMER"
  }'
```

Copy the returned `data.token` value as the customer token.

### 13. Place an order

Use one or more menu item ids from the same restaurant.

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <customer-token>" \
  -d '{
    "items": [
      {
        "menuItemId": "<menuItemId>",
        "quantity": 2
      }
    ]
  }'
```

Expected success response:

```json
{
  "status": 1,
  "message": "Order placed successfully",
  "data": {
    "id": "order-id",
    "customerId": "customer-id",
    "restaurantId": "restaurant-id",
    "totalAmount": 24000,
    "status": "PENDING",
    "items": [
      {
        "id": "order-item-id",
        "orderId": "order-id",
        "menuItemId": "menu-item-id",
        "quantity": 2,
        "price": 12000
      }
    ]
  }
}
```

Copy the returned `data.id` as the order id.

### 14. Get my orders

```bash
curl http://localhost:5000/api/orders/my \
  -H "Authorization: Bearer <customer-token>"
```

### 15. Accept an order

Only the restaurant owner for the ordered restaurant can accept it.

```bash
curl -X PATCH http://localhost:5000/api/orders/<orderId>/accept \
  -H "Authorization: Bearer <restaurant-token>"
```

### 16. Mark an order as preparing

```bash
curl -X PATCH http://localhost:5000/api/orders/<orderId>/prepare \
  -H "Authorization: Bearer <restaurant-token>"
```

### 17. Register a rider user

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Rider User",
    "email": "rider@example.com",
    "password": "password123",
    "phone": "255700000004",
    "role": "RIDER"
  }'
```

Copy the returned `data.token` value as the rider token.

### 18. Assign rider to an order

This assigns the logged-in rider to the order and changes the status to `OUT_FOR_DELIVERY`.

```bash
curl -X PATCH http://localhost:5000/api/orders/<orderId>/assign \
  -H "Authorization: Bearer <rider-token>"
```

### 19. Mark an order as delivered

```bash
curl -X PATCH http://localhost:5000/api/orders/<orderId>/deliver \
  -H "Authorization: Bearer <rider-token>"
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

Examples of order business rule errors:

```json
{
  "status": 0,
  "message": "Order must contain items"
}
```

```json
{
  "status": 0,
  "message": "All items must be from the same restaurant"
}
```

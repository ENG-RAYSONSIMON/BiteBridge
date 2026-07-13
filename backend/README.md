# BiteBridge Backend API

Simple guide for running and manually testing the current Express API endpoints mounted in `src/app.ts`.

## Base URL

```text
http://localhost:3000
```

When running with Docker, set `PORT=3000` so the Node server listens on the same port exposed by the container.

## Setup

### Run Everything With Docker

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
POSTGRES_PORT=5433
DATABASE_URL=postgresql://your_postgres_user:your_url_encoded_postgres_password@localhost:5433/your_postgres_database?schema=public
DATABASE_URL_DOCKER=postgresql://your_postgres_user:your_url_encoded_postgres_password@db:5432/your_postgres_database?schema=public
PORT=3000
NODE_ENV=development
JWT_SECRET=your-secret
```

The `DATABASE_URL` value in `.env` is useful for local Prisma commands and editor tooling. If your password contains special characters, URL encode them. For example, `Postgres@2026` becomes `Postgres%402026`.

Docker Compose uses `DATABASE_URL_DOCKER` inside Docker so containers connect to the internal database service at `db:5432`.

Start the development stack:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This starts:

- `db`: PostgreSQL 16 Alpine
- `migrate`: Prisma migration runner
- `app`: Express API using the Dockerfile `development` stage
- `studio`: Prisma Studio

The API is available at:

```text
http://localhost:3000
```

Prisma Studio is available at:

```text
http://localhost:5555
```

The database is also exposed locally for tools such as TablePlus or DBeaver:

```text
localhost:5433
```

By default this repo maps PostgreSQL to `localhost:5433` to avoid clashing with a local PostgreSQL already using `5432`. Inside Docker, services still connect to `db:5432`.

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

Run a shell inside the app container:

```bash
docker compose -f docker-compose.dev.yml exec app sh
```

Apply Prisma migrations manually if needed:

```bash
docker compose -f docker-compose.dev.yml run --rm migrate
```

The `migrate` container already runs before the API starts.

Apply a new migration after the Docker containers are already running:

```bash
cd backend
docker compose -f docker-compose.dev.yml run --rm migrate
docker compose -f docker-compose.dev.yml exec app npx prisma migrate status
docker compose -f docker-compose.dev.yml restart app studio
```

Use this when you add a new folder under `prisma/migrations/` and want to apply it to the PostgreSQL database running in Docker. The first command applies pending migrations, the second confirms the database is up to date, and the restart reloads the API and Prisma Studio.

Run Prisma commands inside Docker:

```bash
docker compose -f docker-compose.dev.yml exec app npx prisma --help
```

Shortcut scripts are also available from the `backend` folder:

```bash
npm run docker:dev
npm run docker:dev:detached
npm run docker:down
npm run docker:reset
```

Use `docker:reset` only when you want to delete the development database volume and start with an empty database.

### Docker-First Data Flow

After `docker compose -f docker-compose.dev.yml up --build` is running, test the API:

```bash
curl http://localhost:3000/
```

Expected response:

```json
{
  "status": 1,
  "message": "Food Ordering API is running"
}
```

Register a user. New users start as `CUSTOMER` automatically:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Mama Bite",
    "email": "restaurant@example.com",
    "password": "password123"
  }'
```

Copy `data.token` from the response, then switch the account to `RESTAURANT`:

```bash
curl -X PATCH http://localhost:3000/api/auth/me/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -d '{
    "role": "RESTAURANT"
  }'
```

Copy the returned `data.token` from the role update response. Use it as `RESTAURANT_TOKEN`.

Create a restaurant:

```bash
curl -X POST http://localhost:3000/api/restaurants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RESTAURANT_TOKEN" \
  -d '{
    "name": "Mama Bite Kitchen",
    "description": "Fresh local meals",
    "address": "Dar es Salaam",
    "phone": "+255700000001"
  }'
```

Create a menu item:

```bash
curl -X POST http://localhost:3000/api/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer RESTAURANT_TOKEN" \
  -d '{
    "name": "Pilau",
    "description": "Spiced rice with beef",
    "price": 8000
  }'
```

Copy `data.id` from the menu item response. Use it as `MENU_ITEM_ID`.

Register a customer:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Customer",
    "email": "customer@example.com",
    "password": "password123"
  }'
```

Copy `data.token` from the response. Use it as `CUSTOMER_TOKEN`.

Create an order:

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -d '{
    "items": [
      {
        "menuItemId": "MENU_ITEM_ID",
        "quantity": 2
      }
    ]
  }'
```

Now open Prisma Studio and inspect the inserted records:

```text
http://localhost:5555
```

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

New users are registered as `CUSTOMER`. Logged-in users can update their own role to one of these self-assignable roles:

```text
CUSTOMER, RESTAURANT, RIDER
```

`ADMIN` is not self-assignable through the public API.

All roles are:

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
| PATCH | `/api/auth/me/role` | Any logged-in user | Update current user's role to CUSTOMER, RESTAURANT, or RIDER and receive a fresh JWT |
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
| GET | `/api/orders/available` | RIDER | List ready, unassigned orders available for pickup |
| PATCH | `/api/orders/:id/accept` | RESTAURANT | Accept an order for the logged-in user's restaurant |
| PATCH | `/api/orders/:id/prepare` | RESTAURANT | Mark an order as preparing |
| PATCH | `/api/orders/:id/ready` | RESTAURANT | Mark a preparing order as ready for pickup |
| PATCH | `/api/orders/:id/assign` | RIDER | Assign the logged-in rider to a ready order |
| PATCH | `/api/orders/:id/deliver` | RIDER | Mark an assigned order as delivered |

## Order Status Flow

Orders use these statuses:

```text
PENDING, ACCEPTED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
```

Current endpoint flow:

```text
CUSTOMER creates order -> PENDING
RESTAURANT accepts order -> ACCEPTED
RESTAURANT starts preparing -> PREPARING
RESTAURANT marks ready -> READY_FOR_PICKUP
RIDER assigns self -> OUT_FOR_DELIVERY
RIDER marks delivered -> DELIVERED
```

Order rules:

- A customer order must contain at least one item.
- All items in one order must come from the same restaurant.
- `totalAmount` is calculated by the API from menu item prices and quantities.
- Restaurant users can accept only orders for their own restaurant.
- Restaurant users can mark only their own accepted orders as preparing.
- Restaurant users can mark only their own preparing orders as ready for pickup.
- Riders can list ready, unassigned orders.
- Riders can assign themselves only to ready, unassigned orders.
- Riders can mark delivered only out-for-delivery orders assigned to themselves.

## Example Testing Flow

### 1. Check the API

```bash
curl http://localhost:3000/
```

Expected success response:

```json
{
  "status": 1,
  "message": "Food Ordering API is running"
}
```

### 2. Register a user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Restaurant Owner",
    "email": "owner@example.com",
    "password": "password123",
    "phone": "255700000001"
  }'
```

Copy the returned `data.token` value. New users are `CUSTOMER` by default.

### 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123"
  }'
```

### 4. Become a restaurant user

```bash
curl -X PATCH http://localhost:3000/api/auth/me/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "role": "RESTAURANT"
  }'
```

Copy the returned `data.token` value and use it for restaurant protected requests.

### 5. Get the current user

```bash
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

### 6. Create a restaurant

Only a user with role `RESTAURANT` can create a restaurant.

```bash
curl -X POST http://localhost:3000/api/restaurants \
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

### 7. List restaurants

```bash
curl http://localhost:3000/api/restaurants
```

### 8. Get my restaurant

```bash
curl http://localhost:3000/api/restaurants/me \
  -H "Authorization: Bearer <token>"
```

### 9. Create a menu item

The logged-in restaurant user must already have a restaurant.

```bash
curl -X POST http://localhost:3000/api/menu \
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

### 10. Get my menu

```bash
curl http://localhost:3000/api/menu/my \
  -H "Authorization: Bearer <token>"
```

### 11. Get public restaurant menu

```bash
curl http://localhost:3000/api/menu/restaurant/<restaurantId>
```

This only returns items where `isAvailable` is `true`.

### 12. Delete a menu item

```bash
curl -X DELETE http://localhost:3000/api/menu/<menuItemId> \
  -H "Authorization: Bearer <token>"
```

### 13. Register a customer user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Customer User",
    "email": "customer@example.com",
    "password": "password123",
    "phone": "255700000003"
  }'
```

Copy the returned `data.token` value as the customer token.

### 14. Place an order

Use one or more menu item ids from the same restaurant.

```bash
curl -X POST http://localhost:3000/api/orders \
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

### 15. Get my orders

```bash
curl http://localhost:3000/api/orders/my \
  -H "Authorization: Bearer <customer-token>"
```

### 16. Accept an order

Only the restaurant owner for the ordered restaurant can accept it.

```bash
curl -X PATCH http://localhost:3000/api/orders/<orderId>/accept \
  -H "Authorization: Bearer <restaurant-token>"
```

### 17. Mark an order as preparing

```bash
curl -X PATCH http://localhost:3000/api/orders/<orderId>/prepare \
  -H "Authorization: Bearer <restaurant-token>"
```

### 18. Register a rider user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Rider User",
    "email": "rider@example.com",
    "password": "password123",
    "phone": "255700000004"
  }'
```

Copy the returned `data.token` value, then switch the account to `RIDER`:

```bash
curl -X PATCH http://localhost:3000/api/auth/me/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <rider-token>" \
  -d '{
    "role": "RIDER"
  }'
```

Copy the returned `data.token` value as the rider token.

### 19. Mark an order as ready for pickup

Only the restaurant owner for the ordered restaurant can mark a preparing order as ready.

```bash
curl -X PATCH http://localhost:3000/api/orders/<orderId>/ready \
  -H "Authorization: Bearer <restaurant-token>"
```

### 20. List available orders as rider

This returns orders with status `READY_FOR_PICKUP` that do not have a rider yet.

```bash
curl http://localhost:3000/api/orders/available \
  -H "Authorization: Bearer <rider-token>"
```

### 21. Assign rider to an order

This assigns the logged-in rider to a ready order and changes the status to `OUT_FOR_DELIVERY`.

```bash
curl -X PATCH http://localhost:3000/api/orders/<orderId>/assign \
  -H "Authorization: Bearer <rider-token>"
```

### 22. Mark an order as delivered

```bash
curl -X PATCH http://localhost:3000/api/orders/<orderId>/deliver \
  -H "Authorization: Bearer <rider-token>"
```

## Role Test Endpoints

Use these to confirm role-based access control:

```bash
curl http://localhost:3000/api/auth/restaurant-only \
  -H "Authorization: Bearer <restaurant-token>"

curl http://localhost:3000/api/auth/admin-only \
  -H "Authorization: Bearer <admin-token>"

curl http://localhost:3000/api/auth/rider-only \
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

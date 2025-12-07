# Simple Stripe Express Backend

A streamlined e-commerce backend API with essential features: user authentication, product management, and payments with Stripe integration.

## Features

- **User Authentication**: JWT-based login/signup with secure password hashing
- **Product Management**: CRUD operations for products with inventory tracking
- **Payment Processing**: Direct purchase with Stripe integration (no cart)
- **Security**: Helmet, CORS, rate limiting, and input validation

## Tax & Fee Structure

- **Government Tax**: 7.25% 
- **Platform Fee**: 3.25%
- **Total**: Subtotal + Government Tax + Platform Fee

## Prerequisites

- Node.js (v14 or higher)
- MySQL Database
- Stripe Account

## Setup Instructions

### 1. Installation

```bash
cd stripe-express-backend
yarn install
```

### 2. Database Setup

Configure your environment variables in `.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (MySQL)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=vipme-stripe-connect
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# CORS Configuration
CLIENT_URL=http://localhost:8081

# Tax and Fee Configuration
GOVERNMENT_TAX_RATE=0.0725
PLATFORM_FEE_RATE=0.0325
```

### 3. Database Setup

Create the database and run migrations:

```bash
# Create database
npx sequelize-cli db:create

# Run migrations
npx sequelize-cli db:migrate

# Seed database with sample data
npx sequelize-cli db:seed:all
```

#### Database Management Commands

**Complete Database Reset (Sequelize CLI - Recommended):**
```bash
# Drop, create, migrate, and seed in sequence
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

**Individual Sequelize Commands:**
```bash
# Drop database
npx sequelize-cli db:drop

# Create database
npx sequelize-cli db:create

# Run migrations
npx sequelize-cli db:migrate

# Seed database
npx sequelize-cli db:seed:all

# Undo migrations (rollback)
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:migrate:undo:all

# Undo seeders
npx sequelize-cli db:seed:undo:all

# Check migration status
npx sequelize-cli db:migrate:status
```

**Alternative MySQL Commands (if needed):**
```bash
# Drop and recreate database manually
mysql -u root -e "DROP DATABASE IF EXISTS \`vipme-stripe-connect\`;"
mysql -u root -e "CREATE DATABASE \`vipme-stripe-connect\`;"
```

### 4. Start the Server

```bash
# Development mode (with nodemon)
yarn dev

# Production mode
yarn start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user  
- `GET /api/auth/me` - Get current user (token verification)
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products (no pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (requires auth)
- `PATCH /api/products/:id` - Update product (requires auth)
- `DELETE /api/products/:id` - Delete product (requires auth)

### Payments
- `POST /api/payments/create-payment-intent` - Create Stripe payment intent
- `POST /api/payments/confirm-payment` - Confirm payment
- `GET /api/payments/history` - Get payment history
- `GET /api/payments/orders/:id` - Get single order
- `POST /api/payments/webhook` - Stripe webhook handler

### Health Check
- `GET /api/health` - Server health status

## Database Models

### User
- Authentication & profile information (email, firstName, lastName, phoneNumber)
- Role-based access control (user, seller, admin)
- JWT token management
- Email verification and user status tracking
- Stripe customer/account integration

### Product
- Product details with inventory management
- Price and tax calculations
- Seller association

### Order
- Complete order information with payment tracking
- Order status management
- Links to order items

### OrderItem
- Individual items within an order
- Quantity and price tracking
- Product and seller references

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin request handling  
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Request data validation
- **JWT**: Secure authentication tokens
- **Password Hashing**: bcrypt encryption

## Payment Flow

1. User selects products to purchase
2. Frontend calls `/api/payments/create-payment-intent` with items array
3. Backend validates products and creates Stripe PaymentIntent
4. Frontend handles payment with Stripe
5. Backend receives webhook confirmation
6. Order status updated, inventory reduced

## API Usage Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","firstName":"John","lastName":"Doe"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Create Product
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Test Product","title":"Amazing Product","description":"Great product","price":99.99,"category":"Electronics","inventoryQuantity":10}'
```

### Create Payment Intent
```bash
curl -X POST http://localhost:5000/api/payments/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"items":[{"productId":1,"quantity":2}]}'
```

## Development

```bash
# Start development server with auto-reload
yarn dev

# The server will restart automatically on file changes
```

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Use secure JWT secrets (generate random 256-bit key)
3. Configure production MySQL database
4. Set up Stripe webhooks pointing to your domain
5. Use HTTPS for all endpoints
6. Configure proper CORS origins
7. Set appropriate rate limits

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| PORT | Server port | No | 5000 |
| NODE_ENV | Environment mode | No | development |
| DB_HOST | Database host | No | 127.0.0.1 |
| DB_PORT | Database port | No | 3306 |
| DB_DATABASE | Database name | No | vipme-stripe-connect |
| DB_USERNAME | Database username | No | root |
| DB_PASSWORD | Database password | Yes | |
| JWT_SECRET | JWT signing secret | Yes | |
| JWT_EXPIRES_IN | JWT expiration time | No | 7d |
| STRIPE_SECRET_KEY | Stripe secret key | Yes | |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | Yes | |
| CLIENT_URL | Frontend URL for CORS | No | http://localhost:8081 |
| RATE_LIMIT_MAX | Max requests per window | No | 100 |
| RATE_LIMIT_WINDOW_MS | Rate limit window (ms) | No | 900000 |

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT tokens
- **Payments**: Stripe API
- **Security**: Helmet, CORS, bcrypt
- **Validation**: express-validator

## License

MIT License
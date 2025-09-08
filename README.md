# Lenva Backend

NestJS-based backend API for the Lenva Learning Platform with authentication, JWT tokens, and Google OAuth2.

## Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport (Local & Google OAuth2)
- **Documentation**: Swagger/OpenAPI
- **Security**: bcrypt, helmet, CORS
- **Validation**: class-validator + class-transformer

## Features

- ✅ User registration and login
- ✅ JWT access & refresh tokens
- ✅ Google OAuth2 integration
- ✅ Role-based access control (Student, Educator, Admin)
- ✅ PostgreSQL database with TypeORM
- ✅ Swagger API documentation
- ✅ Security best practices (helmet, CORS)
- ✅ Input validation and transformation

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google OAuth2 credentials (optional)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=lenva_db

# JWT Secrets (change these!)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

4. Start the development server:
```bash
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:3001/api/v1
- **Swagger Docs**: http://localhost:3001/api/v1/docs

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login with email/password |
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/profile` | Get current user profile |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users/profile` | Get current user | JWT |
| GET | `/users` | List all users | Admin |
| GET | `/users/:id` | Get user by ID | JWT |
| PATCH | `/users/:id` | Update user | JWT |
| DELETE | `/users/:id` | Delete user | Admin |

## Frontend Integration

The backend is designed to work with the React frontend. Key integration points:

### Expected Request Format

```typescript
// Login
POST /api/v1/auth/login
{
  "email": "student@test.com",
  "password": "password123",
  "role": "student" | "educator" | "admin"
}

// Register
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student" | "educator" | "admin"
}
```

### Response Format

```typescript
{
  "user": {
    "id": "uuid",
    "email": "student@test.com",
    "name": "John Doe",
    "role": "student",
    "avatar": "url",
    "streak": 5,
    "joinDate": "2024-01-01T00:00:00.000Z",
    "educatorIds": [],
    "managedStudentIds": [],
    "groupIds": []
  },
  "access_token": "jwt_token",
  "refresh_token": "refresh_jwt_token"
}
```

### Google OAuth Flow

1. Frontend redirects to: `GET /api/v1/auth/google`
2. User completes Google OAuth
3. Backend redirects to: `${FRONTEND_URL}/auth/callback?access_token=...&refresh_token=...`
4. Frontend extracts tokens from URL and stores them

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (Unique)
- `name`
- `password` (Hashed)
- `role` (student|educator|admin)
- `avatar` (URL)
- `googleId` (Google OAuth ID)
- `streak` (Learning streak)
- `educatorIds` (Array of educator IDs)
- `managedStudentIds` (Array of student IDs)
- `groupIds` (Array of group IDs)
- `refreshToken` (Hashed)
- `joinDate`

## Development

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod

# Testing
npm run test
npm run test:e2e
npm run test:cov

# Linting
npm run lint
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `3001` |
| `API_PREFIX` | API prefix | `api/v1` |
| `DATABASE_*` | PostgreSQL config | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRATION` | JWT expiration | `1d` |
| `JWT_REFRESH_SECRET` | Refresh token secret | - |
| `JWT_REFRESH_EXPIRATION` | Refresh expiration | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | - |
| `FRONTEND_URL` | Frontend URL | `http://localhost:5173` |

## Security Features

- Password hashing with bcrypt
- JWT access & refresh tokens
- HTTP security headers with Helmet
- CORS configuration
- Input validation and sanitization
- Role-based access control
- Secure refresh token rotation

## Contributing

1. Follow TypeScript and NestJS best practices
2. Add tests for new features
3. Update documentation
4. Ensure all linting passes

## License

Private - Lenva Learning Platform

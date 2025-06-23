# MERN Stack API - User Auth & Task Management

A backend API built with Node.js, Express.js, and MongoDB (using Mongoose) for a MERN stack application. It features user authentication, JWT-based authorization, and CRUD operations for task management.

## Features

*   **User Authentication:**
    *   User registration (`/api/auth/register`)
    *   User login (`/api/auth/login`) generating JWT
    *   Password hashing using bcryptjs
*   **Authorization:**
    *   JWT middleware to protect routes
    *   Users can only access and manage their own resources (e.g., tasks)
*   **User Profile Management:**
    *   Fetch authenticated user's profile (`/api/auth/profile`)
    *   Update authenticated user's profile (`/api/auth/me`) - name, email, password
*   **Task Management:**
    *   Create new tasks (`POST /api/tasks`)
    *   Get all tasks for the logged-in user (`GET /api/tasks`)
    *   Get a specific task by ID (`GET /api/tasks/:id`)
    *   Update a task (`PUT /api/tasks/:id`)
    *   Delete a task (`DELETE /api/tasks/:id`)
*   **Database:**
    *   MongoDB integration using Mongoose ODM
    *   In-memory MongoDB for running tests (`mongodb-memory-server`)
*   **Development & Testing:**
    *   Linting with ESLint and formatting with Prettier
    *   Comprehensive test suites using Jest and Supertest

## Prerequisites

*   [Node.js](https://nodejs.org/) (v14.x or later recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)
*   [MongoDB](https://www.mongodb.com/try/download/community) (for local development/production). The application connects to `mongodb://localhost:27017/mern_api_db_dev` by default if `MONGO_URI` environment variable is not set.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

## Running the Application

### Development

1.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project and add the following variables:
    ```env
    # MongoDB Connection URI (replace with your actual URI if not using local default)
    MONGO_URI=mongodb://localhost:27017/mern_api_db_dev

    # JWT Secret Key (choose a long, random, strong secret)
    JWT_SECRET=YOUR_VERY_STRONG_JWT_SECRET_KEY
    ```
    *Note: If `.env` is not used or `MONGO_URI` is not set, the application will attempt to connect to `mongodb://localhost:27017/mern_api_db_dev`.*
    *Note: If `JWT_SECRET` is not set, a default placeholder will be used (not secure for production).*

2.  **Start the server:**
    ```bash
    npm start
    ```
    The server will typically run on `http://localhost:3000` (or the port specified by `PORT` environment variable). You should see a "MongoDB Connected..." message if the database connection is successful (when not in test mode).

## Running Tests

To run the automated tests:

```bash
npm test
```
Tests use an in-memory MongoDB server, so no external MongoDB instance is required for testing.

## API Endpoints Overview

All API routes are prefixed with `/api`.

### Authentication (`/api/auth`)

*   `POST /register`: Register a new user.
    *   Body: `{ "name": "Test User", "email": "user@example.com", "password": "password123" }`
*   `POST /login`: Login an existing user.
    *   Body: `{ "email": "user@example.com", "password": "password123" }`
*   `GET /profile`: Get the authenticated user's profile. (Requires Bearer Token)
*   `PUT /me`: Update the authenticated user's profile. (Requires Bearer Token)
    *   Body (example): `{ "name": "Updated Name", "email": "new@example.com", "currentPassword": "oldPassword", "newPassword": "newSecurePassword" }` (all fields optional)

### Tasks (`/api/tasks`)

*(All task routes require Bearer Token)*

*   `POST /`: Create a new task.
    *   Body: `{ "title": "My New Task", "description": "Details about the task", "status": "pending", "dueDate": "YYYY-MM-DD" }` (description, status, dueDate are optional)
*   `GET /`: Get all tasks for the authenticated user.
*   `GET /:id`: Get a specific task by its ID.
*   `PUT /:id`: Update a task by its ID.
    *   Body: (Same fields as POST, provide only fields to update)
*   `DELETE /:id`: Delete a task by its ID.

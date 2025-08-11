# PingUp Server

This is the **backend server** for the PingUp social media platform.

## Features

- **User Authentication:** Uses Clerk for secure user management.
- **REST API:** Provides endpoints for user actions and social features.
- **Database:** MongoDB for storing user and platform data.
- **Image Uploads:** Integrated with ImageKit for media storage.
- **Event Handling:** Uses Inngest for background jobs and event-driven workflows.
- **CORS:** Configured for secure cross-origin requests with the frontend.

## Tech Stack

- **Node.js** (ES Modules)
- **Express.js**
- **MongoDB** (via Mongoose)
- **Clerk** (authentication)
- **ImageKit** (media storage)
- **Inngest** (event handling)
- **dotenv** (environment variables)

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env` and fill in your secrets.

3. **Run the server:**
   ```sh
   npm run dev
   ```

4. **API Endpoints:**
   - Main: `GET /`
   - Users: `POST /api/users`, etc.

## Folder Structure

- `configs/` – Database, ImageKit, and Inngest configuration
- `routes/` – Express route handlers
- `models/` – Mongoose models
- `controllers/` – Business logic (if present)
- `.env` – Environment variables

## Related

- **Frontend:** See the `client` folder for the React/Vite frontend.

---

**PingUp** is a work in progress. Contributions and feedback are
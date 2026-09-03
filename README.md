# BrickWorks Metrics

A simple dashboard app for tracking IT tickets by application and analyst.

## Local setup

1. Install dependencies:
   npm install
2. Create a local environment file from `.env.example`:
   copy .env.example .env
3. Start MongoDB locally.
4. Start the app:
   npm start

The frontend is served as static pages: open the dashboard at `http://localhost:5000/` and the admin controls at `http://localhost:5000/admin.html`. The API is available at `http://localhost:5000/api`.

## Vercel deployment

Vercel uses `api/index.js` for the `/api` endpoints. Add these environment variables in the Vercel project settings before deploying:

`APP_USERNAME`, `APP_PASSWORD`, and `MONGODB_URI`

The MongoDB connection must be reachable from Vercel, such as a MongoDB Atlas connection string. The local fallback memory mode is not persistent between Vercel function invocations.

## MongoDB

The app is configured to connect to a local MongoDB instance by default at:
`mongodb://127.0.0.1:27017/brickworks_metrics`

You can update the connection string in `.env`.

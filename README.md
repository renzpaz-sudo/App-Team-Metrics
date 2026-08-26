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

The frontend is served as a static page and the API is available at `http://localhost:5000/api`.

## MongoDB

The app is configured to connect to a local MongoDB instance by default at:
`mongodb://127.0.0.1:27017/brickworks_metrics`

You can update the connection string in `.env`.

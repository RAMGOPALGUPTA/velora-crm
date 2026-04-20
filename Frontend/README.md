# CRM Frontend

This frontend is a React + Vite app connected to the CRM backend in `../Backend`.

## Features

- Login and registration
- JWT-based protected dashboard
- Lead list with search and status filters
- Lead create and update modal
- Admin-only delete action
- Live status chart and summary cards

## Run locally

1. Start the backend on port `5000`
2. Start the frontend:

```bash
npm run dev
```

The Vite dev server proxies `/api` requests to `http://localhost:5000`.

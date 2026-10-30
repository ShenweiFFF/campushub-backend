# CampusHub client

React + TypeScript UI for the reservation API. The dev server proxies `/api` to the backend on port 3000.

```bash
npm install
npm run dev
```

API calls live in `src/api/campushubApi.ts`. Set `VITE_API_BASE_URL` only when the UI is not using that proxy.

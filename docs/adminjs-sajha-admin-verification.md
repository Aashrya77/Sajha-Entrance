# AdminJS `/sajha-admin` Verification

This project serves AdminJS from `/sajha-admin`.

## Route Wiring

- Server AdminJS root path: `Server/admin/config/paths.js`
- Server AdminJS mount: `Server/admin/Admin.js`
- Server health/admin discovery response: `Server/server.js`
- Frontend admin URL helpers: `App/src/api/config.js`
- Frontend admin redirect route: `App/src/App.jsx`
- Frontend admin redirect page: `App/src/pages/AdminRedirect/AdminRedirect.jsx`
- Vite dev proxy: `App/vite.config.js`

## Manual Checks

1. Start the backend and frontend in development, or deploy both with the current config.
2. Open `http://localhost:5000/sajha-admin` directly against the backend.
3. Confirm the AdminJS login page renders and the browser does not request `/admin/*` assets.
4. Sign in with a valid admin account and confirm the dashboard loads.
5. In browser devtools, verify AdminJS assets return `200` under `/sajha-admin`, such as:
   - `/sajha-admin/login`
   - `/sajha-admin/frontend/assets/...`
   - `/sajha-admin/admin-theme.css`
   - `/sajha-admin/Dashboard.css`
6. Trigger at least one AdminJS API-backed action and confirm it succeeds under `/sajha-admin/api/...`.
7. Open the public frontend route for the admin redirect and confirm it resolves to the backend admin URL:
   - `http://localhost:3000/sajha-admin`
8. Confirm the health endpoint reports the renamed path:
   - `GET /api/health`
   - expected `data.adminRootPath === "/sajha-admin"`
9. Visit `http://localhost:5000/admin` and confirm it does not render the AdminJS dashboard.

## Session Note

The admin session cookie intentionally keeps `path=/` so authenticated backend routes outside the AdminJS mount, such as `/api/youtube-library/*`, continue to receive the same admin session after the route rename.

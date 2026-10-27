# Astra+ Campus Vite frontend

This app uses React + Vite + TypeScript and imports the existing Orbita Max portal components, pages, layout, and Tailwind design system under src/orbita. The role-specific sample data is still illustrative until each screen is connected to the new API.

## Local run
```sh
cd apps/web
pnpm install
pnpm dev
```

Copy .env.example to .env.local when configuring the API and Supabase Auth. VITE_API_BASE_URL is the API origin (for example http://localhost:4000); the client maps existing /api routes to /api/v1.

## Demo testing
The quick demo login panel appears only in Vite development mode. Accounts can preview the Principal, Administrator, Coordinator, HOD, Faculty, Staff, and pending-member UI states. Shared demo password: Demo@1234. This is a client-only preview with sample data; it does not authenticate to the API or grant access to institutional records.

Do not enable demo preview in production, and do not treat frontend role state as authorization.

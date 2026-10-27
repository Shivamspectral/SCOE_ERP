# Astra+ Campus web

React + Vite + TypeScript app. The first slice includes an Orbita-inspired staff workspace and local-only demo account switcher. Demo data is illustrative and does not represent real college records.

Run from repository root after installing workspace dependencies:
```sh
pnpm install
pnpm --filter @astra-campus/web dev
```

Demo sign-in controls are rendered only when Vite runs in development mode. They are a UI-preview mechanism, not server authentication, and grant no access to live data. Production identity must be verified by the NestJS API and roles/scopes loaded from persisted institutional records.

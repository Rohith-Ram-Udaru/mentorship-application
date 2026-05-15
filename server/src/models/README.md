SQLite persistence is implemented in `server/src/config/db.js` and `server/src/services/sqlStore.js`.

The API still exposes domain-shaped resources for users, pairings, sessions, feedback, KRAs, KPIs, and KPI history. This folder is kept to preserve the requested architecture boundary and document the storage model after the SQLite migration.

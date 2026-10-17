# Beyond Marks document API

The API accepts a reference document and instructions, stores both job state and generated files, and returns a DOCX download.

## Endpoints

- `GET /health`
- `POST /api/jobs` with multipart fields `reference` and `prompt`
- `GET /api/jobs/:id`
- `GET /api/jobs/:id/download`

Without Azure environment variables, files are stored under `backend/data`. In Azure, set `AZURE_STORAGE_ACCOUNT_URL` and grant the container app's managed identity the `Storage Blob Data Contributor` role.

The current report processor is a validation implementation. Replace `src/report.js` with the authorized Codex/skill-backed processor when access is available.

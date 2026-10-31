# Beyond Marks Workspace

**A learning workspace for recorded courses, multilingual voice assistance, and class preparation.**

Workspace brings the student dashboard and local class administration tools of **Beyond Marks AI Academy** into one Next.js application. Students can explore lesson previews and speak with Orby, while the local admin coordinates recording uploads, translation, and delivery to the study classroom.

> **Project status:** Active development. The student experience is a design preview with a structured course curriculum and a connected local voice assistant. Email/password and Google phone verification are implemented against the central Azure account API. Workspace at `beyondmarks.ai` shares its account service with Shop at `dashboard.beyondmarks.ai`. Payment, verified enrollment, and production course progress remain unfinished.

## Features

### Student dashboard

- Compact welcome card with an editable name, profile photo, preferred language, and selected plan.
- System Design Masterclass: 12 session cards in one horizontally draggable and swipeable row, with hidden scrollbar, soft edge fades, previous/next navigation, and a centered Show all grid toggle. The sessions contain 120 globally numbered micro lessons with the supplied company examples. Open a session to browse its ten classes in the same sideways slider, with arrows, dragging, hidden scrollbar, and Show all. All sessions returns to the session browser; navigation starts in slider mode.
- Responsive session and class grids, with planned 8-12 minute lessons and an eight-part teaching outline available for every class. Page scrolling remains available while the side scrollbar is hidden.
- A collection of 120 original learning quotes, rotating every five hours.
- Browser-local profile, notes, question drafts, and Orby introduction status.
- Shared pricing-page corner artwork, responsive layouts, and reduced-motion support.
- Animated sidebar with Courses/Purchase, Shop, Projects, Notes and AI Agent, plus settings, notifications and a profile/logout menu. A valid plan query previews the Courses state; no plan previews Purchase. Real purchase verification is not connected. Notes, profile settings and Orby reuse the existing tools; Shop opens the live Workshop at dashboard.beyondmarks.ai in the same tab; Projects shows a design-stage panel. On phones the sidebar becomes a compact bottom dock.

The System Design classes are **curriculum previews with recordings coming soon**, not playable recordings. The estimated teaching duration is 16-24 hours. Company names identify teaching examples, not partnerships or endorsements. Pricing selection and dashboard-preview buttons open the sign-in/signup form for new visitors. Sign-in uses the Azure account session. The dashboard checks that session on the server; browser preview markers no longer grant access. Selecting a plan does not establish a paid enrollment. The earlier ten 18-second AI demo videos remain in `public/ai-demos/` but are not assigned to these classes.

### Orby voice assistant

Orby welcomes each student by name on first introduction. The button changes from **Introduce Orby** to **Orby** only after the welcome finishes playing; completed introductions are remembered in the local profile.

1. Click Orby to start listening.
2. Click again to finish the question and hear the answer.
3. Click while Orby speaks to interrupt and ask another question, or press **Escape** to close it.

Speech recognition automatically selects the language for each answer. Supported spoken responses include **English, Hindi, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, and Telugu**. Assamese spoken responses require Sarvam beta access. The introductory welcome is in English.

Orby streams speech through Sarvam and answers through an Azure OpenAI deployment. It currently handles general study questions; the dashboard does not yet provide it with lesson transcripts or timestamp context.

### Local class administration

- Stream recordings to the local class pipeline and monitor processing from `/admin`.
- Split recordings exceeding **1.9 GB or 59 minutes** into normalized H.264/AAC parts, leaving headroom below the configured provider limits.
- Request translation and original-speaker dubbing for 11 Indian languages plus English, skipping the source language.
- Join translated parts, align subtitle offsets using actual media durations, and export videos, SRT captions, and timed metadata.
- Resume checkpointed jobs and reuse successful remote work when retrying.
- Open completed lessons in the companion study classroom.

The pipeline currently assumes one teacher per recording. Local disk capacity determines total upload capacity; intermediate files and translated outputs require additional space. The worker reserves 2 GB of free disk space and stops ambiguous remote submissions to avoid duplicate charges.

## Architecture

| Component | Responsibility | Default local address |
| --- | --- | --- |
| Next.js application | Homepage, pricing, student dashboard, class admin | `http://127.0.0.1:3002` |
| Class worker | Uploads, queue coordination, pipeline integration | `http://127.0.0.1:4318` |
| Orby voice service | Streaming recognition, AI answers, speech synthesis | `ws://127.0.0.1:4319/voice` |
| Companion study app | Translated recordings, timestamped classroom Q&A | `http://127.0.0.1:3000` |
| Companion dubbing studio | Existing recording translation interface | `http://127.0.0.1:3003` |
| Workshop (hosted) | Shop destination from the student sidebar | `https://dashboard.beyondmarks.ai` |
| Document API | Reference uploads and DOCX validation reports | `http://localhost:8080` |

The frontend uses **Next.js 15.5.28, React 18, and JavaScript**. Local services use Node.js; Orby uses WebSockets, Web Audio, **Sarvam `saaras:v4` / `bulbul:v3`**, and streaming Azure OpenAI responses. The separate document API uses Express and supports local storage or Azure Blob Storage.

## Getting started

### Dashboard preview

Use a current Node.js LTS release with `process.loadEnvFile` support (Node.js 24.12 or newer), npm, and Git.

```powershell
git clone https://github.com/beyondmarks-ai/Workspace.git
cd Workspace
npm ci
npm run admin
```

Open [the student dashboard](http://127.0.0.1:3002/dashboard?plan=classes) or [pricing](http://127.0.0.1:3002/pricing). The curriculum, class outlines, and dashboard design work without the companion projects. Orby requires its voice service; class processing requires the full local setup below.

### Full local class workspace

The current integration is designed for Windows and expects these sibling projects, each with its own dependencies installed:

```text
D:\Workspace\
D:\Live Class\lib\class-pipeline.js
D:\Live Class\lib\pipeline-media.js
D:\Ssc\
```

`Live Class` and `Ssc` are separate projects and are **not included in this repository**. The launcher resolves them relative to the Workspace directory. The class worker imports the two pipeline modules shown above.

Before starting the full workspace:

1. Install the companion projects and their dependencies.
2. Make FFmpeg and FFprobe available on `PATH`.
3. Configure the existing Sarvam credentials in `Live Class/.env.local` and the required study/voice credentials in `Ssc/.env.local`.
4. Sign in with `az login` using an identity authorized to access the configured Azure OpenAI deployment.

From the Workspace directory:

```powershell
powershell -File .\Start-ClassWorkspace.ps1
```

Shop opens the live Workshop at [dashboard.beyondmarks.ai](https://dashboard.beyondmarks.ai) in the same tab; no local Workshop service is required. Both apps use the same Azure account and secure domain session after this authentication release is deployed to both sites.

The launcher starts missing services in hidden windows and writes logs to the ignored `tmp/` directory. Open [class administration](http://127.0.0.1:3002/admin) and keep the PC awake while processing.

Source files, job manifests, and intermediate parts live in `Live Class/pipeline/`. Completed videos, subtitles, and metadata are written to `Ssc/.local-uploads/`.


### Shared accounts and phone verification

- Production domains: `https://beyondmarks.ai` (Workspace) and `https://dashboard.beyondmarks.ai` (Shop).
- Workspace uses a same-origin `/api/auth` proxy. It forwards only the session cookie to the fixed server-configured `AUTH_API_ORIGIN`, defaulting to the Shop domain. No Azure signing secret is copied to Workspace.
- Google project: `project-8eeef9d3-080a-4f49-95e`. Phone authentication is enabled for India only, with authorized domains and a browser key restricted to authentication APIs and the two sites/local development origins.
- Configure `FIREBASE_PROJECT_ID` and `FIREBASE_WEB_API_KEY` on the Workshop App Service before deploying its changed code. The web key is public client configuration; Azure storage and session secrets remain server-only.
- For local integration, run Workshop on `127.0.0.1:3004` and set Workspace `AUTH_API_ORIGIN=http://127.0.0.1:3004`. The local environment files already contain this development configuration. In production use the HTTPS Shop URL.
- `/phone-signin` is a dedicated page so Google's verification challenge can receive focus outside a native modal dialog. SMS delivery is chargeable; the final real-phone verification must be performed by the student.
- Shop validates Google's signature, issuer, audience, expiry, recent phone authentication and India phone format. Phone bindings and login attempt limits use conditional Azure Blob writes; binding preserves existing account IDs, credits and permissions.
- Authentication and registration do not purchase courses or grant administrator privileges. Changing a linked phone currently requires support.
- Run `npm run test:auth` in each repo and `npm run test:dashboard` in Workspace. Build both with `npm run build` before release. The package overrides pin patched PostCSS and gRPC dependencies; `npm audit` currently reports no known vulnerabilities.

Release verification: automated authentication and dashboard tests pass. Real SMS delivery, account linking, and cross-domain sign-in still require a completed live acceptance test. Google verification must remain enabled.
### Voice configuration

Start Orby separately with `npm run voice`. The service reads the process environment and local environment files in Workspace and the sibling Ssc project. Keep credentials server-side and out of version control.

| Variable | Purpose |
| --- | --- |
| `SARVAM_API_KEY` | Sarvam speech service credential |
| `ORBY_AZURE_ENDPOINT` | Azure OpenAI resource endpoint |
| `ORBY_AZURE_DEPLOYMENT` | Deployment for streaming answers; current default is `gpt-5-4-mini-fast` |
| `AZURE_CLI_PYTHON` | Azure CLI Python executable when its installation differs from the Windows default |

For another environment, set the Azure endpoint and deployment explicitly. The current local integration uses Azure CLI access tokens cached in memory. Check service availability at `http://127.0.0.1:4319/health`.

### Document API

The homepage Join button opens email/password sign-in and registration against the central Azure API. Phone OTP uses Google Identity Platform and returns to Azure for signed-token verification. Students first sign in with email/password, then link their verified phone using their current password. Unverified contact numbers are never used to match accounts. The shared HttpOnly, Secure, SameSite=Lax cookie lasts seven days across beyondmarks.ai and dashboard.beyondmarks.ai. Signing out clears the shared cookie. Existing users must sign in once after the cookie migration. No passwords, OTPs or Google tokens are saved in browser storage.

The separate reference-document API remains available:

```powershell
cd backend
npm ci
npm start
```

The API listens at `http://localhost:8080`; the homepage account flow does not call it. The full-workspace launcher does not start this API.

The current processor generates a validation DOCX report. See [backend documentation](backend/README.md) for endpoints and Azure storage configuration.

## Development commands

Run these commands from the repository root unless noted otherwise.

| Command | Purpose |
| --- | --- |
| `npm run admin` | Start the frontend on loopback port 3002 |
| `npm run dev` | Start Next.js on its default port; may conflict with the companion study app |
| `npm run build` | Create the production frontend build |
| `npm start -- -H 127.0.0.1 -p 3002` | Serve a completed frontend build on the local integration port |
| `npm run classes` | Start the class worker; requires the companion pipeline modules |
| `npm run voice` | Start the local Orby voice service |
| `npm run test:dashboard` | Check curriculum integrity, retained demo data, plans, quotes, and introduction completion |
| `npm run test:voice` | Check language routing, streaming, microphone processing, cancellation, and request boundaries with mocked providers |
| `npm run test:classes` | Check local uploads and request validation; requires the companion pipeline modules |
| `npm test --prefix backend` | Run all backend tests; requires backend dependencies and companion pipeline modules |
| `node scripts/generate-ai-demos.mjs` | Regenerate demo videos using FFmpeg/FFprobe and Windows Arial |

Before merging frontend changes, run the relevant tests and `npm run build`. Stop the development server before building in the same checkout, then restart it when the build finishes.

## Repository structure

| Path | Contents |
| --- | --- |
| `app/admin/` | Local class administration |
| `app/components/` | Shared page components |
| `app/dashboard/` | Student interface, session curriculum (`system-design.mjs`), and Orby |
| `app/dashboard/orbkit/` | Vendored orb runtime and shader notices |
| `app/pricing/` | Plan presentation and dashboard previews |
| `backend/src/` | Class worker, voice service, and document API |
| `backend/test/` | Automated regression tests |
| `public/ai-demos/` | Ten local lesson preview videos |
| `public/orby-mic-worklet.js` | Microphone audio processing |
| `scripts/` | Demo media generation |
| `Start-ClassWorkspace.ps1` | Windows local-service launcher |

## Data handling and release status

Account name and preferred language are saved through the Azure account API. Photos, notes, drafts, and Orby introduction status remain browser-local, keyed by the authenticated user ID. Earlier unscoped preview data is preserved but is not automatically assigned to a real account. These values never establish paid enrollment.

Orby sends speech to Sarvam and question text with recent dialogue to Azure. The voice service keeps up to four exchanges in memory for the current connection and does not save audio or transcripts locally. Local request checks, message limits, timeouts, cancellation, and rate limits are implemented.

Public student hosting still requires authenticated enrollment, per-student quotas, HTTPS/WSS, and a production service identity. Full-length, multi-gigabyte recordings and every supported language have not been validated end to end. Teacher voice consistency may vary between independently dubbed parts.

### Third-party notices

The vendored SHDR-02 shader by **XorDev** is restricted to **non-commercial use with attribution**; the Orbkit runtime is MIT-licensed. Obtain commercial permission or replace the shader before a paid-product launch. See [the retained vendor notice](app/dashboard/orbkit/README.md). Third-party assets retain their respective terms.

---

Developed by **Rakesh Kumar** at [Beyond Marks AI Academy](https://beyondmarks.ai).

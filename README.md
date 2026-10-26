# Beyond Marks Workspace

**A learning workspace for recorded courses, multilingual voice assistance, and class preparation.**

Workspace brings the student dashboard and local class administration tools of **Beyond Marks AI Academy** into one Next.js application. Students can explore lesson previews and speak with Orby, while the local admin coordinates recording uploads, translation, and delivery to the study classroom.

> **Project status:** Active development. The student experience is a design preview with working demo playback and a connected local voice assistant. Payment, authentication, verified enrollment, and production course progress are not integrated yet.

## Features

### Student dashboard

- Compact welcome card with an editable name, profile photo, preferred language, and selected plan.
- Ten playable AI lesson demos in a horizontal carousel, with mouse dragging, touch swiping, keyboard scrolling, and previous/next navigation.
- Minimal lesson cards with a 16:9 thumbnail, accurate duration, and numbered title.
- A collection of 120 original learning quotes, rotating every five hours.
- Browser-local profile, notes, question drafts, and Orby introduction status.
- Shared pricing-page corner artwork, responsive layouts, and reduced-motion support.

The included videos are **18-second silent demos**, not full course recordings. Pricing links select a dashboard preview; they do not verify a purchase or grant course access.

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
| Document API | Reference uploads and DOCX validation reports | `http://localhost:8080` |

The frontend uses **Next.js 14, React 18, and JavaScript**. Local services use Node.js; Orby uses WebSockets, Web Audio, **Sarvam `saaras:v4` / `bulbul:v3`**, and streaming Azure OpenAI responses. The separate document API uses Express and supports local storage or Azure Blob Storage.

## Getting started

### Dashboard preview

Use a current Node.js LTS release with `process.loadEnvFile` support (Node.js 22 or newer), npm, and Git.

```powershell
git clone https://github.com/beyondmarks-ai/Workspace.git
cd Workspace
npm ci
npm run admin
```

Open [the student dashboard](http://127.0.0.1:3002/dashboard?plan=classes) or [pricing](http://127.0.0.1:3002/pricing). Demo playback and the dashboard design work without the companion projects. Orby requires its voice service; class processing requires the full local setup below.

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

The launcher starts missing services in hidden windows and writes logs to the ignored `tmp/` directory. Open [class administration](http://127.0.0.1:3002/admin) and keep the PC awake while processing.

Source files, job manifests, and intermediate parts live in `Live Class/pipeline/`. Completed videos, subtitles, and metadata are written to `Ssc/.local-uploads/`.

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

The homepage also provides a reference-document workflow backed by a separate API:

```powershell
cd backend
npm ci
npm start
```

Set `NEXT_PUBLIC_API_URL=http://localhost:8080` in the root `.env.local` and restart Next.js to use the local API. This variable contains the public API address, not a credential. The full-workspace launcher does not start this API.

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
| `npm run test:dashboard` | Check lesson data, carousel interactions, plans, quotes, and introduction completion |
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
| `app/dashboard/` | Student interface, lesson data, and Orby |
| `app/dashboard/orbkit/` | Vendored orb runtime and shader notices |
| `app/pricing/` | Plan presentation and dashboard previews |
| `backend/src/` | Class worker, voice service, and document API |
| `backend/test/` | Automated regression tests |
| `public/ai-demos/` | Ten local lesson preview videos |
| `public/orby-mic-worklet.js` | Microphone audio processing |
| `scripts/` | Demo media generation |
| `Start-ClassWorkspace.ps1` | Windows local-service launcher |

## Data handling and release status

Profile details, uploaded profile photos, notes, drafts, and introduction status are stored in the student's browser. They are not synced to an account and must not be used as enrollment authorization.

Orby sends speech to Sarvam and question text with recent dialogue to Azure. The voice service keeps up to four exchanges in memory for the current connection and does not save audio or transcripts locally. Local request checks, message limits, timeouts, cancellation, and rate limits are implemented.

Public student hosting still requires authenticated enrollment, per-student quotas, HTTPS/WSS, and a production service identity. Full-length, multi-gigabyte recordings and every supported language have not been validated end to end. Teacher voice consistency may vary between independently dubbed parts.

### Third-party notices

The vendored SHDR-02 shader by **XorDev** is restricted to **non-commercial use with attribution**; the Orbkit runtime is MIT-licensed. Obtain commercial permission or replace the shader before a paid-product launch. See [the retained vendor notice](app/dashboard/orbkit/README.md). Third-party assets retain their respective terms.

---

Developed by **Rakesh Kumar** at [Beyond Marks AI Academy](https://beyondmarks.ai).

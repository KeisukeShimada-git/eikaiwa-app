# TravelTalk MVP

TravelTalk is a realtime English conversation practice app for Japanese travelers.

The current deployment plan avoids Firebase Blaze:

- Firebase Hosting free plan serves the Web/PWA app.
- Vercel Serverless Functions hold the OpenAI API key.
- GitHub merge to `main` can deploy the Firebase Hosting side automatically.
- Vercel can auto-deploy the API when connected to the same GitHub repo.

## Project Structure

```text
web/        React + Vite PWA frontend
api/        Vercel Serverless Functions for OpenAI calls
backend/    Local Express backend for Windows development
TravelTalk/ Reference SwiftUI prototype
```

## Local Development On Windows

### 1. Start The Local Backend

```powershell
cd C:\Users\keisu\Documents\eikaiwa\backend
Copy-Item .env.example .env
npm.cmd install
notepad .env
```

Set your OpenAI API key:

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
PORT=8787
REALTIME_MODEL=gpt-realtime-2
FEEDBACK_MODEL=gpt-5.5
```

Start it:

```powershell
npm.cmd run dev
```

Keep this PowerShell open.

### 2. Start The Web App

Open a second PowerShell:

```powershell
cd C:\Users\keisu\Documents\eikaiwa\web
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://localhost:5173
```

## Production Architecture

```text
iPhone Safari / browser
  -> Firebase Hosting
  -> VITE_API_BASE_URL
  -> Vercel Serverless Functions
  -> OpenAI API
```

The browser never receives the OpenAI API key.

## Deploy API To Vercel

### 1. Create A Vercel Project

Open:

https://vercel.com/

Import this GitHub repository.

Set the project root to the repository root.

### 2. Add Vercel Environment Variables

In Vercel:

```text
Project -> Settings -> Environment Variables
```

Add:

```text
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
REALTIME_MODEL=gpt-realtime-2
FEEDBACK_MODEL=gpt-5.5
ALLOWED_ORIGIN=https://your-firebase-site.web.app
```

For early testing, `ALLOWED_ORIGIN` can be omitted. The API will allow all origins.

### 3. Deploy

Vercel deploys automatically when the GitHub repo is connected.

After deploy, your API base URL will look like:

```text
https://your-vercel-project.vercel.app
```

Test:

```text
https://your-vercel-project.vercel.app/api/health
```

Expected:

```json
{ "ok": true }
```

## Deploy Web App To Firebase Free Hosting

### 1. Create Firebase Project

Create a Firebase project:

https://console.firebase.google.com/

The free Spark plan is OK because we only use Hosting.

### 2. Install Firebase CLI

```powershell
npm.cmd install -g firebase-tools
firebase login
```

### 3. Configure Project ID

```powershell
cd C:\Users\keisu\Documents\eikaiwa
Copy-Item .firebaserc.example .firebaserc
notepad .firebaserc
```

Set your project ID:

```json
{
  "projects": {
    "default": "my-eikaiwa-a"
  }
}
```

### 4. Build Web With Vercel API URL

```powershell
cd C:\Users\keisu\Documents\eikaiwa\web
notepad .env
```

Set:

```env
VITE_API_BASE_URL=https://your-vercel-project.vercel.app
```

Build:

```powershell
npm.cmd run build
```

### 5. Deploy Hosting

```powershell
cd C:\Users\keisu\Documents\eikaiwa
firebase deploy --only hosting
```

Firebase will show a public URL like:

```text
https://my-eikaiwa-a.web.app
```

## GitHub Auto Deploy

There is a GitHub Actions workflow:

```text
.github/workflows/firebase-deploy.yml
```

It deploys Firebase Hosting when `main` is updated.

Add these GitHub Actions secrets:

```text
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT
VERCEL_API_BASE_URL
```

`VERCEL_API_BASE_URL` example:

```text
https://your-vercel-project.vercel.app
```

`FIREBASE_SERVICE_ACCOUNT` is a Google Cloud service account JSON with permission to deploy Firebase Hosting.

Suggested role:

```text
Firebase Hosting Admin
```

After this:

```text
merge to main
  -> GitHub Actions builds web/
  -> Firebase Hosting deploys
  -> Vercel separately deploys api/
```

## Main Features

- Realtime voice conversation with OpenAI Realtime API
- Scenario selection:
  - Barcelona hotel check-in
  - Lisbon hostel
  - Marrakech riad
  - Istanbul airport transfer
  - Restaurant payment
  - Directions
- AI acts as local staff
- AI continues with natural follow-up questions
- Realistic travel problems are injected
- No correction during conversation
- Saying `feedback` or pressing the finish button opens feedback mode
- Feedback includes grammar, natural expressions, vocabulary, and overall score

## Notes

- Do not put `OPENAI_API_KEY` in `web/.env`.
- `VITE_API_BASE_URL` is safe because it is only the public Vercel URL.
- Set OpenAI usage limits before public testing.
- Before launch, add authentication and rate limiting to the Vercel API.

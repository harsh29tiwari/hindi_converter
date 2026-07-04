# Hindi Converter — Deployment Guide

This project is split into two parts because your Gemini API key must **never**
be visible in browser code (GitHub Pages only serves static files, so anything
in the HTML/JS is public to anyone who views the page source).

```
hindi-converter/
├── index.html              ← Frontend (goes to GitHub Pages)
└── backend/
    ├── api/
    │   └── convert.js      ← Backend proxy (goes to Vercel)
    └── package.json
```

## Step 1 — Push everything to GitHub

1. Create a new repo on GitHub, e.g. `hindi-converter`.
2. Push this whole folder (both `index.html` and `backend/`) to that repo.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/hindi-converter.git
git push -u origin main
```

## Step 2 — Deploy the backend on Vercel (free)

1. Go to https://vercel.com and sign up/log in with your GitHub account.
2. Click **"Add New Project"** → import your `hindi-converter` GitHub repo.
3. When it asks for the **Root Directory**, set it to `backend`
   (since that's where `api/convert.js` and `package.json` live).
4. Before deploying, add an **Environment Variable**:
   - Name: `GEMINI_API_KEY`
   - Value: your actual Gemini API key
5. Click **Deploy**.
6. Once deployed, Vercel gives you a URL like:
   `https://hindi-converter-backend.vercel.app`
   Your working endpoint will be:
   `https://hindi-converter-backend.vercel.app/api/convert`

## Step 3 — Point the frontend to your backend

Open `index.html` and find this line near the bottom `<script>`:

```js
const BACKEND_URL = "https://YOUR-BACKEND-URL.vercel.app/api/convert";
```

Replace it with the real URL from Step 2, then commit and push the change.

## Step 4 — Enable GitHub Pages for the frontend

1. In your GitHub repo, go to **Settings → Pages**.
2. Under "Build and deployment", set **Source** to "Deploy from a branch".
3. Choose branch `main` and folder `/ (root)` — assuming `index.html` sits at
   the repo root. (If you'd rather keep it in a `frontend/` folder, put
   `index.html` there and select that folder instead.)
4. Save. GitHub will give you a live URL like:
   `https://YOUR-USERNAME.github.io/hindi-converter/`

## Step 5 — Test it

Open your GitHub Pages URL, type something in Hinglish, hit Convert.
It should call your Vercel backend, which calls Gemini, and return the
Hindi output — without ever exposing your API key to visitors.

## Notes / good practices

- **CORS**: `convert.js` currently allows requests from any origin (`*`) for
  simplicity. Once things work, tighten this by replacing `*` with your exact
  GitHub Pages URL in `res.setHeader('Access-Control-Allow-Origin', ...)`.
- **Rate limiting / abuse**: since the endpoint is public, consider adding
  basic rate limiting (e.g. Vercel's built-in options, or a simple in-memory
  counter) if you're worried about abuse driving up your Gemini bill.
- **Rotate your key**: since the old key was hardcoded in the original HTML
  file you shared, treat it as compromised — generate a new Gemini API key
  and use that one in the `GEMINI_API_KEY` environment variable.

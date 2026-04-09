# PromptCast — iPad Teleprompter

A professional teleprompter web app optimized for iPad. Works as a PWA (add to home screen), supports mirror mode for physical teleprompter reflectors, Google Drive import, file upload, and copy-paste.

---

## Features

- **Smooth auto-scroll** with adjustable speed (0.2× – 5×)
- **Mirror mode** — horizontal (for glass beam-splitter reflectors) and/or vertical flip
- **Google Drive** — browse and import Google Docs directly
- **File import** — `.txt`, `.md`, `.rtf`, `.docx`, `.enex` (Apple Notes export)
- **Copy/paste** — paste any text directly into the script editor
- **Local storage** — scripts persist on your device, no account needed
- **PWA** — add to iPad home screen for a full-screen native-like experience
- **Keyboard shortcuts** — Space, arrows, R, +/−

---

## Deploy in 3 Steps

### Step 1 — Push to GitHub

```bash
cd promptcast
git init
git add .
git commit -m "Initial PromptCast"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/promptcast.git
git push -u origin main
```

### Step 2 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your `promptcast` GitHub repo
3. Leave all settings as default — Vercel auto-detects Next.js
4. Click **Deploy**

Your app will be live at `https://promptcast.vercel.app` (or similar) in ~60 seconds.

### Step 3 — Add to iPad Home Screen

1. Open your Vercel URL in Safari on iPad
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

PromptCast now opens full-screen like a native app.

---

## Google Drive Setup (Optional)

To enable Google Docs import:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable **Google Drive API** — search "Drive API" in the API Library
4. Go to **APIs & Services → Credentials**
5. Click **Create Credentials → OAuth 2.0 Client ID**
6. Choose **Web application**
7. Add your Vercel URL to **Authorized JavaScript origins**:
   - `https://your-app.vercel.app`
   - `http://localhost:3000` (for local dev)
8. Copy the **Client ID**

### Add to Vercel

In your Vercel project → **Settings → Environment Variables**, add:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID = your_client_id_here.apps.googleusercontent.com
```

Then **Redeploy** from the Vercel dashboard.

---

## Apple Notes Import

Apple Notes doesn't expose a direct API on web — use the built-in export:

1. Open the note in the **Notes** app on iPad
2. Tap the **Share** button (top right)
3. Tap **Send a Copy → Save to Files** → choose `.txt` format
4. In PromptCast, tap **Import** and select the saved file

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `↑` / `↓` | Nudge scroll |
| `R` | Restart from top |
| `+` / `=` | Speed up |
| `-` | Slow down |
| `⌘S` | Save script (in editor) |
| `Esc` | Close modal |

---

## Mirror Mode Guide

| Setting | Use Case |
|---------|----------|
| **Horizontal only** | Glass beam-splitter / hood-mount reflectors (standard setup) |
| **Vertical only** | Upside-down mounting |
| **Both** | Inverted + reflected |

For a basic iPad teleprompter reflector hood (available on Amazon for ~$30–80), enable **Horizontal mirror only**.

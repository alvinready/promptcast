# AiPrompter — AI Teleprompter

A professional AI-powered teleprompter web app for iPad, iPhone & desktop. Works as a PWA (add to home screen for native fullscreen), supports mirror mode for physical teleprompter reflectors, AI script simplification, Google Drive import, and file upload.

---

## Features

- **Smooth auto-scroll** with adjustable speed (0.2× – 5×)
- **Ai Simplify** — one-tap AI keyword extraction to condense your script into bullet cues
- **Mirror mode** — horizontal (for glass beam-splitter reflectors) and/or vertical flip
- **Play timer** — elapsed time counter while reading
- **Google Drive** — browse and import Google Docs directly
- **File import** — `.txt`, `.md`, `.rtf`, `.docx`, `.enex` (Apple Notes export)
- **Copy/paste** — paste any text directly into the script editor
- **Local storage** — scripts persist on your device, no account needed
- **PWA** — add to iPhone/iPad home screen for true fullscreen with no browser chrome
- **Keyboard shortcuts** — Space, arrows, R, F, +/−

---

## Deploy in 3 Steps

### Step 1 — Push to GitHub

```bash
cd promptcast
git init
git add .
git commit -m "Initial AiPrompter"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aiprompter.git
git push -u origin main
```

### Step 2 — Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**
2. Import your GitHub repo
3. Add environment variable: `ANTHROPIC_API_KEY` = your Anthropic API key
4. Leave all other settings as default — Vercel auto-detects Next.js
5. Click **Deploy**

Your app will be live in ~60 seconds.

### Step 3 — Add to iPhone/iPad Home Screen (True Fullscreen)

1. Open your Vercel URL in Safari
2. Tap the **Share** button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**

AiPrompter now opens as a standalone app with no browser chrome, no system buttons.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Powers the Ai Simplify feature |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Optional | Enables Google Drive import |

---

## Google Drive Setup (Optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create/select a project and enable **Google Drive API**
3. Create **OAuth 2.0 Credentials → Web application**
4. Add your Vercel URL to **Authorized JavaScript origins**
5. Copy the **Client ID** and add it to Vercel environment variables as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

---

## Apple Notes Import

1. Open the note in the **Notes** app
2. Tap **Share → Send a Copy → Save to Files** (`.txt` format)
3. In AiPrompter, tap **Import** and select the saved file

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
| `Space` | Play / Pause (auto-restarts from top if at end) |
| `↑` / `↓` | Nudge scroll |
| `R` | Restart from top |
| `F` | Toggle fullscreen |
| `+` / `=` | Speed up |
| `-` | Slow down |
| `⌘B` | Toggle sidebar |

---

## Mirror Mode Guide

| Setting | Use Case |
|---------|----------|
| **Horizontal only** | Glass beam-splitter / hood-mount reflectors (standard setup) |
| **Vertical only** | Upside-down mounting |
| **Both** | Inverted + reflected |

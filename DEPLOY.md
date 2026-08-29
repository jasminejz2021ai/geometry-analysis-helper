# Deploying the Geometry & Analysis Helper

This app is deployed **split-host**, like the Pollen web app:

- **Backend** (FastAPI) → **Render.com**
- **Frontend** (Vite/React) → **Vercel**, which rewrites `/api/*` to the Render backend.

The one twist: the AI runs on **your Mac's Ollama** (`qwen3:8b` for text,
`qwen2.5vl:7b` for vision). Cloud hosts can't run those models, so the Render
backend reaches your Ollama through a **public tunnel**. Your Mac must be on and
the tunnel running for AI features to work in production.

```
Browser ──> Vercel (static frontend)
                │  /api/* rewrite
                ▼
          Render (FastAPI backend)
                │  LLM_API_BASE
                ▼
      Tunnel (ngrok/cloudflared) ──> your Mac's Ollama :11434
```

---

## 1. Expose your local Ollama with a tunnel

Ollama listens on `http://localhost:11434`. Pick one tunnel tool:

### Option A — Cloudflare Tunnel (free, no account for quick tunnels)

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:11434
```

It prints a URL like `https://random-words.trycloudflare.com`. Your
OpenAI-compatible base becomes that URL **+ `/v1`**:

```
https://random-words.trycloudflare.com/v1
```

### Option B — ngrok (free tier, requires signup)

```bash
brew install ngrok
ngrok config add-authtoken <YOUR_TOKEN>
ngrok http 11434
```

Use the printed `https://<id>.ngrok-free.app` **+ `/v1`**.

> Note: Ollama rejects requests whose `Host` header isn't localhost unless you
> set `OLLAMA_HOST=0.0.0.0`. If you hit 403s through the tunnel, restart Ollama
> with `OLLAMA_HOST=0.0.0.0 ollama serve` (and set `OLLAMA_ORIGINS=*`).

Keep this tunnel process running whenever you want the deployed app to work.

---

## 2. Deploy the backend to Render

1. Push this repo to GitHub (see step 4).
2. On [render.com](https://render.com) → **New → Web Service** → connect the repo.
3. Render auto-detects `backend/render.yaml`. Confirm:
   - Root dir: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set these environment variables (the ones marked `sync: false`):
   - `LLM_API_BASE` = your tunnel URL + `/v1` (e.g. `https://xxx.trycloudflare.com/v1`)
   - `LLM_API_KEY` = leave **blank** (Ollama needs no key)
   - `CORS_ORIGINS` = your Vercel URL (fill in after step 3), e.g.
     `https://geometry-tutor.vercel.app`
   - (`LLM_MODEL`, `LLM_VISION_MODEL`, `FALLBACK_PROVIDER`, `LLM_PROVIDER` are
     preset in `render.yaml`.)
5. Deploy. Note the backend URL, e.g. `https://geometry-tutor-api.onrender.com`.
6. Verify: open `https://geometry-tutor-api.onrender.com/api/health`.

---

## 3. Deploy the frontend to Vercel

1. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
2. Set **Root Directory** to `frontend`.
3. Vercel reads `frontend/vercel.json` (framework Vite, build `npm run build`,
   output `dist`).
4. Edit the rewrite target in `frontend/vercel.json` to your real Render URL if
   it differs from `https://geometry-tutor-api.onrender.com`.
5. Deploy. Note the Vercel URL, then go back and set Render's `CORS_ORIGINS` to
   it and redeploy the backend.

---

## 4. Push to GitHub

```bash
cd ~/projects/geometry-tutor
git init
git add -A
git commit -m "Initial commit: geometry & analysis helper"
gh repo create geometry-tutor --private --source=. --remote=origin --push
```

---

## Notes & caveats

- **Render free tier sleeps** after inactivity; first request may take ~30s to
  wake. AI replies also take ~1–2 min on local qwen3:8b.
- **Your Mac + tunnel must be running** for AI. If they're off, templated
  Geometry still works, but AI answers, Analysis, chat, and photo solving fail.
- For a fully cloud-independent deploy, switch `LLM_API_BASE`/`LLM_API_KEY` to a
  hosted OpenAI-compatible API and set `LLM_MODEL`/`LLM_VISION_MODEL` to a
  hosted model (e.g. `gpt-4o-mini` / `gpt-4o`). No tunnel needed then.

---

## "Report a problem" email (optional)

The site has a **Report a problem** button (header and footer). Submitted
reports are emailed to you via [Resend](https://resend.com) when configured;
otherwise they're written to the Render server logs (always, as a backup).

To receive reports by email, set these env vars on Render:

- `RESEND_API_KEY` — a key from <https://resend.com/api-keys> (free tier is fine)
- `REPORT_EMAIL_TO` — the inbox that should receive reports
- `REPORT_EMAIL_FROM` — optional; defaults to Resend's shared sender
  `Problem Reports <onboarding@resend.dev>` (works without domain verification
  for low volume). To send from your own domain, verify it in Resend first.

Each report includes the user's description, their optional email, a UTC
timestamp, and auto-captured context (current subject/topic, page URL, browser).

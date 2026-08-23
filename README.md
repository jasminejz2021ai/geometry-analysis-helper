# Geometry Tutor

A web app that helps high school students learn geometry. A student asks a
geometry question, sees a worked explanation, and gets several auto-generated
similar problems to practice. Practice answers are checked with tolerance and
step-by-step solutions can be revealed.

Problem generation is **hybrid**:

- **Rule-based templates** (deterministic, offline) covering the Honors
  Geometry syllabus: angle relationships, similar triangles, polygon angle
  sums, Pythagorean theorem, special right triangles (30-60-90, 45-45-90),
  right-triangle trigonometry (SOH-CAH-TOA), circle area/circumference, circle
  theorems (inscribed angle, arcs, tangents), triangle/rectangle area &
  perimeter, volume & surface area of solids, and coordinate distance/midpoint.
- **LLM / Dify fallback** for proofs and any question that doesn't match a
  template (optional; only active when a key is configured).

Students can either type a question or pick a topic from the Honors Geometry
topic browser to get instant practice.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS, KaTeX for math, SVG for
  diagrams.
- Backend: Python + FastAPI + Pydantic, `sympy` for exact math.

## Project layout

```
geometry-tutor/
  backend/
    app/
      main.py             FastAPI app and endpoints
      classifier.py       question -> topic (keyword/regex)
      templates/          one file per topic, each generates similar problems
      llm.py              optional LLM fallback (strict JSON)
      checker.py          numeric-tolerance answer checking
      models.py           Pydantic models
      config.py           settings / .env handling
    requirements.txt
    .env.example
  frontend/
    src/
      App.tsx
      api.ts, types.ts
      components/         QuestionInput, SolutionView, PracticeList,
                          PracticeCard, DiagramSVG, Katex
    package.json
```

## Running locally

### 1. Backend (port 8000)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # optional: add an LLM key to enable the fallback
uvicorn app.main:app --reload --port 8000
```

Health check: `curl http://127.0.0.1:8000/api/health`

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api/*` to the
backend on port 8000, so no CORS setup is needed in development.

## Enabling the AI fallback (optional)

When a question doesn't match a template, the app routes it to a configurable
fallback provider set by `FALLBACK_PROVIDER` in `backend/.env`. Without the
matching key, template topics still work fully and unrecognized questions
return a friendly message listing supported topics.

### Option A: Dify chatflow (default)

Point the app at a Dify "chatflow"/chat app (Dify Cloud or self-hosted). The
app calls `POST {base}/v1/chat-messages` in blocking mode and expects the app's
answer to be JSON matching:

```json
{
  "original": { "prompt": "...", "answer": "...", "steps": ["...", "..."] },
  "practice": [{ "prompt": "...", "answer": "...", "steps": ["..."] }]
}
```

Configure `backend/.env`:

```
FALLBACK_PROVIDER=dify
DIFY_API_BASE=https://api.dify.ai   # or your self-hosted base URL
DIFY_API_KEY=app-...                # App API key from Dify (Publish -> API Access)
```

In the Dify app, use the system prompt from `backend/app/prompts.py`
(`SYSTEM_PROMPT`) so it returns strict JSON, and (optionally) define a `count`
input variable. Non-JSON answers are retried once, then fall back gracefully.

### Solving from a photo

The "upload a photo" feature (`/api/solve-image`) uploads the image to Dify's
file API and sends it to the chatflow. For this to work, the Dify app must use
a **vision-capable model** (e.g. `gpt-4o`, `gpt-4o-mini`, `claude-3.5-sonnet`,
or `gemini-1.5`) and have **image/vision input enabled** in the app settings.
If the model can't read images, the app returns a friendly "please type the
problem" message.

### Option B: Direct OpenAI/Anthropic

```
FALLBACK_PROVIDER=openai   # or "anthropic"
LLM_PROVIDER=openai        # or "anthropic"
LLM_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini      # or an Anthropic model id
```

## API

- `POST /api/solve` `{ question, count }` -> worked example + practice problems
- `POST /api/solve-image` multipart `image` + `count` -> reads a photo of a problem (via Dify vision) and returns worked example + practice
- `POST /api/generate-more` `{ topic, count }` -> more template problems
- `POST /api/check` `{ expected, submitted }` -> `{ correct, feedback }`
- `GET /api/topics` -> supported template topics (id -> title)
- `GET /api/topics-grouped` -> topics grouped into Honors Geometry units
- `GET /api/health` -> status, active `fallback_provider`, and whether it's enabled

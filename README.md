# Portfolio Website

Charcoal and gold portfolio for Sravan Karra, with a Flask admin panel and a Netlify static export.

## Run locally

```bash
.\.venv\Scripts\python.exe backend\app.py
```

Or double-click `run.bat`.

- Site: http://127.0.0.1:5000
- Admin: http://127.0.0.1:5000/admin_login_page

## Folder layout

```
backend/                 Python app, data, and build
  app.py
  resume_pdf.py
  build_netlify.py
  portfolio_data.json
  seed_live_data.mjs     Sync local data to the live Netlify blob
  requirements.txt
frontend/                Pages, styles, scripts, and images
  templates/
  static/
    css/
    js/
    images/
    resumes/
netlify/functions/       Live-site APIs
```

## Deploy to Netlify

```bash
python backend/build_netlify.py
npx netlify-cli deploy --prod --dir=dist --functions netlify/functions --site YOUR_SITE_ID
```

To push portfolio content to the live blob after deploy:

```bash
node backend/seed_live_data.mjs
```

## Admin

Keep `.env`, `backend/admin_auth.json`, and `.secret_key` private. Copy `.env.example` for the variable names.

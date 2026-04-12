# Aniruddha Mitra — Personal Brand Site
## The AI Leaders Circle

A fully static personal brand + networking site deployable on Vercel.

---

## 🗂 Project Structure

```
mitra-site/
├── public/                  # Static site root (served by Vercel)
│   ├── index.html           # Main site
│   └── _redirects           # SPA redirect rules
├── content/                 # ← DROP YOUR FILES HERE
│   ├── research/            # Research papers, white papers → Research section
│   ├── blog/                # Articles, essays → Insights section
│   ├── portfolio/           # Case study docs → Portfolio section
│   ├── speaking/            # Talk slides, media → Speaking section
│   └── whitepapers/         # Standalone white papers → Research section
├── scripts/
│   └── build-manifest.js    # Scans content/ folders → generates manifest.json
├── vercel.json              # Vercel deployment config
├── package.json             # npm scripts
└── .gitignore
```

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/mitra-site.git
cd mitra-site
npm install
```

### 2. Add Content
Drop files into the correct `content/` folder:

| Folder | Shows up in |
|--------|------------|
| `content/research/` | Research & Papers section |
| `content/whitepapers/` | Research & Papers section |
| `content/blog/` | Insights & Thought Leadership |
| `content/portfolio/` | Portfolio & Case Studies |
| `content/speaking/` | Speaking & Media |

Each file needs a companion `.json` metadata file OR the build script will auto-generate one.

**Example:** Drop `content/research/ai-governance-2025.pdf` and create `content/research/ai-governance-2025.json`:
```json
{
  "title": "AI-Native Data Governance: From Policy to Platform",
  "type": "whitepaper",
  "excerpt": "A practitioner's guide to rebuilding data governance for the age of generative AI.",
  "tags": ["AI Governance", "GenAI", "CDO"],
  "date": "March 2025",
  "file": "ai-governance-2025.pdf"
}
```

### 3. Build Manifest & Deploy
```bash
npm run build       # Scans content/ → generates public/manifest.json
npm run dev         # Local preview (opens index.html)
npm run deploy      # Push to GitHub → Vercel auto-deploys
```

---

## 🌐 Vercel Deployment

### One-Time Setup
1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Set **Build Command**: `npm run build`
4. Set **Output Directory**: `public`
5. Click Deploy

### Auto-Deploy on Push
Every `git push` to `main` triggers a new Vercel build automatically.

### Adding Content Without Code
1. Drop your PDF/DOCX into the right `content/` folder
2. Add a `.json` metadata file alongside it
3. `git add . && git commit -m "add new research" && git push`
4. Vercel rebuilds in ~30 seconds ✓

---

## 🔧 Environment Variables (Optional)
Set in Vercel Dashboard → Settings → Environment Variables:

```
ANTHROPIC_API_KEY=sk-ant-...   # For AI chat (already works via browser)
```

---

## 📁 Naming Conventions
- File names: `kebab-case` (e.g., `cdo-operating-model-2025.pdf`)
- Metadata: same name, `.json` extension
- No spaces in filenames

# Content Guide — How to Add Files to Your Site

Every time you add a file to a `content/` folder and push to GitHub,
Vercel rebuilds automatically and your site updates within ~30 seconds.

---

## 📂 Folder → Section Mapping

```
content/
├── research/        →  "Research & Papers" section
├── whitepapers/     →  "Research & Papers" section  (merged with research)
├── blog/            →  "Insights & Thought Leadership" section
├── portfolio/       →  "Portfolio & Case Studies" section
└── speaking/        →  "Speaking & Media" section
```

---

## ✅ Method 1 — Drop File + JSON (Recommended)

Place your file AND a metadata `.json` alongside it:

```
content/research/
  ├── my-paper.pdf          ← your actual document
  └── my-paper.json         ← metadata (same base name!)
```

### JSON Templates by Section

#### Research / Whitepaper
```json
{
  "title": "Your Paper Title Here",
  "type": "research",
  "excerpt": "2–3 sentence description shown on the card.",
  "tags": ["AI Governance", "GenAI", "CDO"],
  "date": "April 2025",
  "author": "Aniruddha Mitra",
  "featured": true,
  "file": "my-paper.pdf"
}
```
> `type` options: `research` | `whitepaper` | `framework`

#### Blog / Insight
```json
{
  "title": "Article Title",
  "type": "blog",
  "excerpt": "What this piece is about in 2–3 sentences.",
  "tags": ["CDO", "Strategy"],
  "date": "April 2025",
  "author": "Aniruddha Mitra",
  "featured": false,
  "file": "article.pdf"
}
```
> `type` options: `blog` | `research` | `framework`

#### Portfolio Case Study
```json
{
  "title": "Project / Engagement Title",
  "type": "portfolio",
  "excerpt": "What you did and the outcome in 2–3 sentences.",
  "tags": ["GCP", "Banking AI"],
  "date": "2024",
  "company": "Client Name · Platform",
  "featured": true,
  "metrics": [
    { "v": "$300M", "l": "GCP Commitment" },
    { "v": "18h→2h", "l": "DFAST Compression" },
    { "v": "95%",   "l": "Dark Data Activated" },
    { "v": "NPS 57→85", "l": "Customer NPS" }
  ],
  "file": "case-study.pdf"
}
```

#### Speaking / Media
```json
{
  "title": "Talk or Media Title",
  "type": "keynote",
  "excerpt": "What this talk covered.",
  "tags": ["Keynote", "AI Strategy"],
  "date": "October 2024",
  "eventDate": "October 15, 2024",
  "location": "Google Cloud Next — Financial Services Summit",
  "author": "Aniruddha Mitra",
  "featured": true,
  "file": "slides.pptx"
}
```
> `type` options: `keynote` | `panel` | `podcast` | `workshop` | `media`

---

## ✅ Method 2 — Drop File Only (Auto-Metadata)

Just drop a file with no `.json`:
```
content/blog/my-article.pdf
```
The build script will **auto-generate** `my-article.json` with:
- Title inferred from the filename (`my-article` → `My Article`)
- Date = file upload date
- Type inferred from folder

You can then edit the auto-generated `.json` to improve the title and excerpt.

---

## ✅ Method 3 — CLI Helper

Run from the project root:
```bash
npm run new-research   # prompts for title, excerpt, tags, etc.
npm run new-blog
npm run new-portfolio
npm run new-speaking
```
This creates the `.json` file for you interactively.

---

## 🚀 Publishing Workflow

### Option A — Full Git Workflow
```bash
# 1. Drop your file into the right content/ folder
cp ~/Downloads/my-paper.pdf content/research/

# 2. Create or edit the .json metadata
nano content/research/my-paper.json

# 3. Build locally to verify
npm run build

# 4. Commit and push → Vercel auto-deploys
git add .
git commit -m "add: AI governance white paper"
git push
```

### Option B — Quick Push Script
```bash
# One-liner after dropping files:
npm run deploy
# (this runs: npm run build && git add . && git commit && git push)
```

### Option C — GitHub Web UI (No Terminal)
1. Go to your GitHub repo
2. Navigate to `content/research/` (or whichever folder)
3. Click **Add file → Upload files**
4. Upload both your PDF and `.json` file
5. Commit directly to `main`
6. Vercel detects the push and deploys automatically ✓

---

## 📋 File Naming Rules

- Use `kebab-case`: `ai-governance-2025.pdf` ✓
- No spaces: `AI Governance 2025.pdf` ✗
- No special chars: `ai_governance&2025.pdf` ✗
- JSON must match PDF base name: `ai-governance-2025.pdf` + `ai-governance-2025.json`

---

## 🔍 Supported File Types

| Extension | Supported | Notes |
|-----------|-----------|-------|
| `.pdf`    | ✅ Yes     | Best for papers, articles, case studies |
| `.docx`   | ✅ Yes     | Word documents |
| `.md`     | ✅ Yes     | Markdown articles |
| `.txt`    | ✅ Yes     | Plain text |
| `.pptx`   | ✅ Yes     | Slide decks (speaking section) |
| `.mp4`    | ✅ Yes     | Video recordings |
| `.png/jpg`| ✅ Yes     | Images, infographics |

---

## 🔗 File Download Links

When a `"file"` field is set in the JSON, the card on the site
automatically shows a download link pointing to `/content/{section}/{filename}`.

Visitors can click to download or view the document directly.

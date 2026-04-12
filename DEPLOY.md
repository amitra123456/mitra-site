# Deployment Guide — GitHub + Vercel

Complete step-by-step guide to get your site live.

---

## Step 1 — Create a GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name it `mitra-site` (or any name you prefer)
3. Set to **Public** or **Private** (both work with Vercel)
4. **Do NOT** initialize with README (you already have one)
5. Click **Create repository**

---

## Step 2 — Push Your Code to GitHub

Open Terminal and run these commands from inside your `mitra-site/` folder:

```bash
cd mitra-site

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "initial: Mitra personal brand site"

# Connect to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/mitra-site.git

# Push to main branch
git branch -M main
git push -u origin main
```

✅ Your code is now on GitHub.

---

## Step 3 — Deploy on Vercel

### 3a. Connect Repo to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub login)
2. Click **Add New → Project**
3. Find and select your `mitra-site` repository
4. Click **Import**

### 3b. Configure Build Settings

In the Vercel project setup screen:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Other |
| **Build Command** | `npm run build` |
| **Output Directory** | `public` |
| **Install Command** | `npm install` |

5. Click **Deploy**

⏱ First deploy takes ~60 seconds. You'll get a live URL like:
`https://mitra-site.vercel.app`

---

## Step 4 — Add a Custom Domain (Optional)

1. In Vercel → Your Project → **Settings → Domains**
2. Add your domain e.g. `aniruddhamitra.com`
3. Follow Vercel's DNS instructions (add CNAME or A record at your registrar)
4. SSL is automatic ✓

Popular domain registrars: Namecheap, GoDaddy, Google Domains, Cloudflare

---

## Step 5 — Set Up GitHub Actions Auto-Deploy (Optional)

The `.github/workflows/deploy.yml` file is already included.
To activate it, add these secrets to your GitHub repo:

1. Go to your GitHub repo → **Settings → Secrets and variables → Actions**
2. Add these three secrets:

### Get Your Vercel Credentials

```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link

# Get your tokens
cat .vercel/project.json
# Shows: { "projectId": "prj_xxx", "orgId": "team_xxx" }
```

| Secret Name | Where to Find It |
|-------------|-----------------|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

Once set, every `git push` to `main` triggers a full rebuild + deploy.

---

## Day-to-Day: Adding New Content

After initial setup, adding content is just 3 commands:

```bash
# 1. Drop your file into the right folder
cp ~/Downloads/paper.pdf content/research/

# 2. Add metadata (or let build-script auto-generate it)
cp template.json content/research/paper.json  # edit title/tags

# 3. Push → auto-deploys in ~30 seconds
git add .
git commit -m "add: new research paper"
git push
```

Or use the shortcut:
```bash
npm run deploy
```

---

## Vercel Environment Variables

Set these in Vercel → Project → Settings → Environment Variables
if you need them in the future:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | For server-side AI (currently runs client-side) |
| `SITE_URL` | Your custom domain e.g. `https://aniruddhamitra.com` |

---

## Troubleshooting

**Build fails on Vercel:**
- Check that `package.json` exists in root
- Check that `scripts/build-manifest.js` exists
- View build logs in Vercel → Deployments → click failed deploy

**manifest.json not updating:**
- The `.gitignore` excludes `public/manifest.json` locally
- On Vercel, `npm run build` generates it fresh each deploy ✓

**Files not showing in sections:**
- Ensure `.json` filename matches the document filename exactly
- Run `npm run build` locally and check terminal output for errors
- Verify the file is in the correct `content/` subfolder

**Custom domain not working:**
- DNS propagation can take up to 48 hours
- Verify CNAME/A records at your registrar
- Check Vercel → Domains for any configuration errors

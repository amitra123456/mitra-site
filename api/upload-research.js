// api/upload-research.js
// Vercel serverless function: commit a research PDF + JSON metadata to GitHub,
// then update public/manifest.json in-place so the new item appears immediately
// on the next Vercel deployment without waiting for a full build-manifest run.
//
// Required Vercel environment variables:
//   GITHUB_TOKEN  — personal access token with repo write scope
//   GITHUB_REPO   — "owner/repo-name" (e.g. "amitra123456/mitra-site")
//   GITHUB_BRANCH — branch to commit to (default: "main")

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token  = process.env.GITHUB_TOKEN;
  const repo   = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !repo) {
    return res.status(503).json({
      error: 'GitHub integration not configured. Set GITHUB_TOKEN and GITHUB_REPO in Vercel environment variables.',
    });
  }

  const { filename, content, metadata } = req.body || {};
  if (!filename || !content) {
    return res.status(400).json({ error: 'Missing filename or content' });
  }

  // Sanitize filename
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const slug = safeFilename.replace(/\.[^.]+$/, '');

  try {
    // 1. Commit the PDF
    await commitFile({ token, repo, branch,
      path: `content/research/${safeFilename}`,
      content,
      message: `upload: add ${safeFilename}`,
    });

    // 2. Commit companion JSON metadata
    const now = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const meta = {
      title:   metadata?.title   || slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type:    metadata?.type    || 'research',
      excerpt: metadata?.excerpt || '',
      tags:    metadata?.tags    || [],
      date:    now,
      file:    safeFilename,
      author:  'Aniruddha Mitra',
      featured: false,
    };
    await commitFile({ token, repo, branch,
      path: `content/research/${slug}.json`,
      content: Buffer.from(JSON.stringify(meta, null, 2)).toString('base64'),
      message: `upload: add metadata for ${slug}`,
    });

    // 3. Update public/manifest.json in GitHub so the item appears immediately
    const manifestItem = {
      id:        slugify(meta.title),
      section:   'research',
      type:      meta.type,
      title:     meta.title,
      excerpt:   meta.excerpt,
      tags:      meta.tags,
      date:      meta.date,
      file:      `/content/research/${safeFilename}`,
      url:       null,
      author:    meta.author,
      featured:  meta.featured,
      company:   null,
      metrics:   null,
      eventDate: null,
      location:  null,
      jobType:   null,
    };
    await updateManifest({ token, repo, branch, item: manifestItem });

    return res.status(200).json({ success: true, item: meta });
  } catch (err) {
    console.error('upload-research error:', err.message);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};

// ── helpers ───────────────────────────────────────────────────────────────────

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Commit (create or update) a single file via the GitHub Contents API. */
async function commitFile({ token, repo, branch, path, content, message }) {
  const url = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'mitra-site-uploader',
  };

  // Get existing SHA if the file already exists (needed for updates)
  let sha;
  const check = await fetch(url, { headers });
  if (check.ok) {
    const existing = await check.json();
    sha = existing.sha;
  }

  const body = { message, content, branch, ...(sha ? { sha } : {}) };
  const put = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!put.ok) {
    const txt = await put.text();
    throw new Error(`GitHub API ${put.status} on ${path}: ${txt}`);
  }
  return put.json();
}

/**
 * Read public/manifest.json from GitHub, prepend the new item to the
 * research array, and commit the result back. If the file doesn't exist
 * yet, create it with just this item so the site can serve it immediately.
 */
async function updateManifest({ token, repo, branch, item }) {
  const path = 'public/manifest.json';
  const url  = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'mitra-site-uploader',
  };

  let manifest = { generated: '', research: [], blog: [], portfolio: [], speaking: [] };
  let sha;

  const getRes = await fetch(url, { headers });
  if (getRes.ok) {
    const fileData = await getRes.json();
    sha = fileData.sha;
    try {
      // GitHub returns base64 with newlines — strip them before decoding
      const raw = Buffer.from(fileData.content.replace(/\n/g, ''), 'base64').toString('utf8');
      manifest = JSON.parse(raw);
    } catch (e) {
      console.warn('Could not parse existing manifest.json, will overwrite:', e.message);
    }
  }

  // Ensure research array exists; remove any duplicate with same id then prepend
  if (!Array.isArray(manifest.research)) manifest.research = [];
  manifest.research = manifest.research.filter(i => i.id !== item.id);
  manifest.research.unshift(item);
  manifest.generated = new Date().toISOString();

  const newContent = Buffer.from(JSON.stringify(manifest, null, 2)).toString('base64');
  const putRes = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `upload: update manifest for "${item.title}"`,
      content: newContent,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!putRes.ok) {
    // Non-fatal — the PDF and JSON were already committed successfully
    const txt = await putRes.text();
    console.warn('Failed to update manifest.json:', txt);
  }
}

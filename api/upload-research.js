// api/upload-research.js
// Vercel serverless function: commit a research PDF + JSON metadata to GitHub.
// This triggers a Vercel rebuild, which runs build-manifest.js and regenerates
// manifest.json so the uploaded paper appears in the Research section.
//
// Required Vercel environment variables:
//   GITHUB_TOKEN  — personal access token with repo write scope
//   GITHUB_REPO   — "owner/repo-name" (e.g. "aniruddhamitra/mitra-site")
//   GITHUB_BRANCH — branch to commit to (default: "main")

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !repo) {
    return res.status(503).json({ error: 'GitHub integration not configured. Set GITHUB_TOKEN and GITHUB_REPO in Vercel environment variables.' });
  }

  const { filename, content, metadata } = req.body || {};

  if (!filename || !content) {
    return res.status(400).json({ error: 'Missing filename or content' });
  }

  // Sanitize filename — allow only safe characters
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
  const slug = safeFilename.replace(/\.[^.]+$/, ''); // strip extension for JSON filename

  try {
    // 1. Commit the PDF to content/research/
    await commitToGitHub({ token, repo, branch, path: `content/research/${safeFilename}`, content });

    // 2. Commit companion JSON metadata to content/research/
    const now = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const meta = {
      title:    metadata?.title   || slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type:     metadata?.type    || 'research',
      excerpt:  metadata?.excerpt || '',
      tags:     metadata?.tags    || [],
      date:     now,
      file:     safeFilename,
      author:   'Aniruddha Mitra',
      featured: false,
    };
    const metaBase64 = Buffer.from(JSON.stringify(meta, null, 2)).toString('base64');
    await commitToGitHub({ token, repo, branch, path: `content/research/${slug}.json`, content: metaBase64 });

    return res.status(200).json({ success: true, item: meta });
  } catch (err) {
    console.error('upload-research error:', err.message);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
};

async function commitToGitHub({ token, repo, branch, path, content }) {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'mitra-site-uploader',
  };

  // Check if the file already exists (needed to get the SHA for updates)
  let sha;
  const checkRes = await fetch(apiUrl, { headers });
  if (checkRes.ok) {
    const existing = await checkRes.json();
    sha = existing.sha;
  }

  const body = {
    message: `upload: add ${path.split('/').pop()}`,
    content,
    branch,
  };
  if (sha) body.sha = sha; // required for updating an existing file

  const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!putRes.ok) {
    const errText = await putRes.text();
    throw new Error(`GitHub API ${putRes.status}: ${errText}`);
  }
  return putRes.json();
}

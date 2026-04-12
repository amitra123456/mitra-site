#!/usr/bin/env node
/**
 * build-manifest.js
 * Scans all content/ folders, reads metadata JSON files,
 * and generates public/manifest.json consumed by index.html
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const OUTPUT_DIR = path.join(ROOT, 'public');
const MANIFEST_PATH = path.join(OUTPUT_DIR, 'manifest.json');
const PUBLIC_CONTENT = path.join(OUTPUT_DIR, 'content');

// Section → folder mapping
const SECTIONS = {
  research:    { folder: 'research',    type: 'research'   },
  whitepapers: { folder: 'whitepapers', type: 'whitepaper' },
  blog:        { folder: 'blog',        type: 'blog'       },
  portfolio:   { folder: 'portfolio',   type: 'portfolio'  },
  speaking:    { folder: 'speaking',    type: 'speaking'   },
};

const SUPPORTED_FILES = ['.pdf', '.docx', '.md', '.txt', '.pptx', '.mp4', '.png', '.jpg'];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function inferType(folder, ext) {
  if (folder === 'whitepapers') return 'whitepaper';
  if (folder === 'blog') return 'blog';
  if (folder === 'portfolio') return 'portfolio';
  if (folder === 'speaking') return 'speaking';
  if (ext === '.pptx') return 'presentation';
  return 'research';
}

function formatDate(mtime) {
  return new Date(mtime).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function scanSection(sectionKey) {
  const { folder, type } = SECTIONS[sectionKey];
  const contentFolder = path.join(CONTENT_DIR, folder);
  const publicFolder = path.join(PUBLIC_CONTENT, folder);

  ensureDir(contentFolder);
  ensureDir(publicFolder);

  if (!fs.existsSync(contentFolder)) return [];

  const files = fs.readdirSync(contentFolder);
  const items = [];
  const processed = new Set();

  // First pass: read all .json metadata files
  files.filter(f => f.endsWith('.json')).forEach(jsonFile => {
    const baseName = jsonFile.replace('.json', '');
    processed.add(baseName);

    try {
      const meta = JSON.parse(fs.readFileSync(path.join(contentFolder, jsonFile), 'utf8'));
      const stat = fs.statSync(path.join(contentFolder, jsonFile));

      // Copy the associated file to public/content if it exists
      if (meta.file) {
        const srcFile = path.join(contentFolder, meta.file);
        const dstFile = path.join(publicFolder, meta.file);
        if (fs.existsSync(srcFile)) {
          fs.copyFileSync(srcFile, dstFile);
        }
      }

      items.push({
        id: slugify(meta.title || baseName),
        section: sectionKey === 'whitepapers' ? 'research' : sectionKey,
        type: meta.type || type,
        title: meta.title || baseName,
        excerpt: meta.excerpt || meta.description || '',
        tags: meta.tags || [],
        date: meta.date || formatDate(stat.mtimeMs),
        file: meta.file ? `/content/${folder}/${meta.file}` : null,
        url: meta.url || null,
        author: meta.author || 'Aniruddha Mitra',
        featured: meta.featured || false,
        company: meta.company || null,
        metrics: meta.metrics || null,
        eventDate: meta.eventDate || null,
        location: meta.location || null,
        jobType: meta.jobType || null,
      });
    } catch (e) {
      console.warn(`⚠️  Could not parse ${jsonFile}:`, e.message);
    }
  });

  // Second pass: auto-generate metadata for files without .json
  files.filter(f => {
    const ext = path.extname(f);
    const base = path.basename(f, ext);
    return SUPPORTED_FILES.includes(ext) && !processed.has(base);
  }).forEach(dataFile => {
    const ext = path.extname(dataFile);
    const base = path.basename(dataFile, ext);
    const srcFile = path.join(contentFolder, dataFile);
    const dstFile = path.join(publicFolder, dataFile);
    const stat = fs.statSync(srcFile);

    // Copy to public
    fs.copyFileSync(srcFile, dstFile);

    // Auto-generate metadata
    const autoTitle = base.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const autoMeta = {
      title: autoTitle,
      type: inferType(folder, ext),
      excerpt: `${autoTitle} — uploaded ${formatDate(stat.mtimeMs)}`,
      tags: [],
      date: formatDate(stat.mtimeMs),
      file: dataFile,
    };

    // Write auto-generated .json next to the file
    const autoJsonPath = path.join(contentFolder, base + '.json');
    fs.writeFileSync(autoJsonPath, JSON.stringify(autoMeta, null, 2));
    console.log(`  ✨ Auto-generated metadata: ${base}.json`);

    items.push({
      id: slugify(autoTitle),
      section: sectionKey === 'whitepapers' ? 'research' : sectionKey,
      ...autoMeta,
      file: `/content/${folder}/${dataFile}`,
      url: null,
      author: 'Aniruddha Mitra',
      featured: false,
    });
  });

  return items;
}

function build() {
  console.log('\n🔨 Building content manifest...\n');
  ensureDir(OUTPUT_DIR);
  ensureDir(PUBLIC_CONTENT);

  const manifest = {
    generated: new Date().toISOString(),
    research: [],
    blog: [],
    portfolio: [],
    speaking: [],
  };

  let total = 0;

  Object.keys(SECTIONS).forEach(sectionKey => {
    const items = scanSection(sectionKey);
    const targetSection = sectionKey === 'whitepapers' ? 'research' : sectionKey;
    manifest[targetSection].push(...items);
    total += items.length;
    console.log(`  ✅ ${sectionKey.padEnd(12)} → ${items.length} items`);
  });

  // Sort each section by date descending
  Object.keys(manifest).forEach(k => {
    if (Array.isArray(manifest[k])) {
      manifest[k].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  });

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ manifest.json generated → ${total} total items`);
  console.log(`📁 Output: ${MANIFEST_PATH}\n`);
}

build();

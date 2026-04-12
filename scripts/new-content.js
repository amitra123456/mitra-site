#!/usr/bin/env node
/**
 * new-content.js
 * CLI helper to scaffold metadata JSON for new content
 * Usage: node scripts/new-content.js <section> [filename]
 * Example: node scripts/new-content.js research my-paper.pdf
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SECTION = process.argv[2];
const FILE_ARG = process.argv[3];

const VALID_SECTIONS = ['research', 'blog', 'portfolio', 'speaking', 'whitepapers'];
const TYPE_DEFAULTS = {
  research: 'research',
  whitepapers: 'whitepaper',
  blog: 'blog',
  portfolio: 'portfolio',
  speaking: 'speaking',
};

if (!SECTION || !VALID_SECTIONS.includes(SECTION)) {
  console.error(`\n❌ Usage: node scripts/new-content.js <section> [filename]`);
  console.error(`   Sections: ${VALID_SECTIONS.join(', ')}\n`);
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function run() {
  console.log(`\n📝 New ${SECTION} content\n`);

  const title = await ask('Title: ');
  const excerpt = await ask('Excerpt / description: ');
  const tags = await ask('Tags (comma-separated): ');
  const file = FILE_ARG || await ask('Filename (e.g. paper.pdf, leave blank if none): ');
  const url = await ask('External URL (optional): ');
  const featured = (await ask('Featured? (y/n): ')).toLowerCase() === 'y';

  let extra = {};
  if (SECTION === 'portfolio') {
    const company = await ask('Company: ');
    const metricsRaw = await ask('Metrics (format: "Value:Label,Value:Label"): ');
    const metrics = metricsRaw ? metricsRaw.split(',').map(m => {
      const [v, l] = m.split(':');
      return { v: v.trim(), l: l?.trim() || '' };
    }) : [];
    extra = { company, metrics };
  }
  if (SECTION === 'speaking') {
    const eventDate = await ask('Event date: ');
    const location = await ask('Location / platform: ');
    extra = { eventDate, location };
  }

  rl.close();

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const now = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  const meta = {
    title,
    type: TYPE_DEFAULTS[SECTION],
    excerpt,
    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    date: now,
    author: 'Aniruddha Mitra',
    featured,
    ...(file && { file }),
    ...(url && { url }),
    ...extra,
  };

  const outDir = path.join(__dirname, '..', 'content', SECTION);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, slug + '.json');
  fs.writeFileSync(outPath, JSON.stringify(meta, null, 2));

  console.log(`\n✅ Created: content/${SECTION}/${slug}.json`);
  if (file) console.log(`📎 Make sure to place "${file}" in: content/${SECTION}/`);
  console.log(`🔨 Run "npm run build" to update the site manifest.\n`);
}

run().catch(e => { console.error(e); process.exit(1); });

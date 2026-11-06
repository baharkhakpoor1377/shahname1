// Runs on Vercel at every deploy: finds the numbered story files and writes stories.json
//   10.m4a (or .mp3)   = the voice          10.jpg (or .png) = cover picture (optional)
//   10.txt             = title on line 1, then the story text
//   10-cards.txt       = flashcards, one per line:  question | answer | short explanation (optional)
const fs = require('fs'), path = require('path');
const AUDIO = ['.m4a', '.mp3', '.aac', '.wav', '.ogg'];
const IMG = ['.jpg', '.jpeg', '.png', '.webp'];
const byId = {};
for (const f of fs.readdirSync(__dirname)) {
  const m = f.match(/^(\d+)(-cards)?(\.[^.]+)$/i);
  if (!m) continue;
  const id = parseInt(m[1], 10), ext = m[3].toLowerCase(), o = (byId[id] = byId[id] || {});
  if (m[2] && ext === '.txt') o.cards = f;
  else if (!m[2] && ext === '.txt') o.text = f;
  else if (!m[2] && AUDIO.includes(ext)) o.audio = f;
  else if (!m[2] && IMG.includes(ext)) o.cover = f;
}
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
const out = [];
for (const id of Object.keys(byId).map(Number).sort((a, b) => a - b)) {
  const o = byId[id];
  let title = 'قصه ' + id, sum = '', text = '';
  if (o.text) {
    const lines = read(o.text).split('\n');
    title = (lines.shift() || title).trim();
    if (lines.length && /^(خلاصه|Summary)\s*[:：]/i.test(lines[0].trim())) sum = lines.shift().replace(/^[^:：]*[:：]/, '').trim();
    text = lines.join('\n').trim();
    if (!sum) {
      const flat = text.replace(/\s+/g, ' ');
      sum = flat.length > 150 ? flat.slice(0, 150).replace(/\s+\S*$/, '') + '…' : flat;
    }
  }
  const cards = [];
  if (o.cards) for (const line of read(o.cards).split('\n')) {
    const p = line.split('|').map(x => x.trim());
    if (p[0] && p[1]) cards.push({ q: p[0], a: p[1], e: p[2] || '' });
  }
  if (!o.audio && !o.text) continue;
  out.push({ id, title, sum, text, cards, audio: o.audio || null, cover: o.cover || null });
}
fs.writeFileSync(path.join(__dirname, 'stories.json'), JSON.stringify(out));
console.log('stories.json written with ' + out.length + ' stories');

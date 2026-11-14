import sharp from 'sharp';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.5" fill="#f0e7d5" opacity=".07"/></pattern></defs>
<rect width="1200" height="630" fill="#131211"/><rect width="1200" height="630" fill="url(#dots)"/>
<path d="M825 0h375v630H760z" fill="#b83525"/><rect x="48" y="40" width="740" height="58" fill="#f2ca46"/>
<text x="70" y="79" font-family="Arial,sans-serif" font-weight="bold" font-size="28" letter-spacing="4" fill="#171717">STEPPENWOLF / STEFAN MALINOVIC</text>
<text x="45" y="265" font-family="Impact,Arial,sans-serif" font-weight="900" font-size="155" fill="#f0e7d5">THE</text>
<text x="45" y="445" font-family="Impact,Arial,sans-serif" font-weight="900" font-size="150" fill="#f2ca46">DESIGNER.</text>
<text x="50" y="540" font-family="Arial,sans-serif" font-weight="bold" font-size="25" fill="#cfc5b4">LEVELS. MISSIONS. GAMES.</text>
<text x="920" y="525" transform="rotate(-12 920 525)" font-family="Impact,Arial,sans-serif" font-size="54" fill="#f2ca46">PLAY IT LOUD!</text>
</svg>`;
await sharp(Buffer.from(svg))
  .png()
  .toFile('public/assets/brand/og-steppenwolf.png');
console.log('Created social sharing image.');

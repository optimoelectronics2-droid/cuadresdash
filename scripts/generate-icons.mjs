// Genera iconos PNG para PWA desde un SVG inline
// Ejecutar: node scripts/generate-icons.mjs
// Requiere: npm install sharp

import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public", "icons");

const SVG_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1A237E"/>
      <stop offset="100%" style="stop-color:#2E7D32"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#g)"/>
  <text x="256" y="290" font-family="Arial,sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">$</text>
  <circle cx="380" cy="140" r="50" fill="#FFD54F"/>
  <text x="380" y="148" font-family="Arial,sans-serif" font-size="50" font-weight="bold" fill="#1A237E" text-anchor="middle" dominant-baseline="central">✓</text>
</svg>`;

async function generate() {
  mkdirSync(publicDir, { recursive: true });

  const sizes = [192, 512];
  for (const size of sizes) {
    const buf = Buffer.from(SVG_ICON);
    const png = await sharp(buf).resize(size, size).png().toBuffer();
    writeFileSync(join(publicDir, `icon-${size}.png`), png);
    console.log(`Generado: icon-${size}.png`);
  }
}

generate().catch(console.error);

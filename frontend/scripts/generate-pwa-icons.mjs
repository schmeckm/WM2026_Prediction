import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');
const svg = readFileSync(join(iconsDir, 'pwa-icon.svg'));

const sizes = [192, 512];
for (const size of sizes) {
  const out = join(iconsDir, `pwa-icon-${size}.png`);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`Wrote ${out}`);
}

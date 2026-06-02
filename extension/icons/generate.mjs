import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(resolve(__dir, 'icon.svg'));

const sizes = [16, 32, 48, 128];

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(resolve(__dir, `icon${size}.png`));
  console.log(`✓ icon${size}.png`);
}

import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
const [,, input, output, width, height, fit='cover'] = process.argv;
const img = sharp(input);
if (height) {
  await img.resize({ width: +width, height: +height, fit }).toFile(output);
} else {
  await img.resize(+width).toFile(output);
}
console.log(`Saved ${output}`);

const fs = require('fs');
const content = fs.readFileSync('C:/Users/LENOVO/Documents/Harestech/welfare-platform/Gemini_Generated_Image_9ns9hx9ns9hx9ns9.svg', 'utf8');

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

const paths = [...content.matchAll(/<path d="([^"]+)"/g)].map(m => m[1].replace(/\n/g, ' '));
for (const p of paths) {
  const parts = p.split(/[^0-9-]+/).filter(n => n.trim() !== '');
  for (let i = 0; i < parts.length - 1; i += 2) {
    const x = parseInt(parts[i]);
    const y = parseInt(parts[i+1]);
    if (x > -90000 && x < 90000 && y > -90000 && y < 90000) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

const actualMinX = minX * 0.1;
const actualMaxX = maxX * 0.1;
const actualMinY = 2048 - (maxY * 0.1);
const actualMaxY = 2048 - (minY * 0.1);

console.log('Bounding Box X:', actualMinX, 'to', actualMaxX);
console.log('Bounding Box Y:', actualMinY, 'to', actualMaxY);
console.log('Width:', actualMaxX - actualMinX);
console.log('Height:', actualMaxY - actualMinY);

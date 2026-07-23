const fs = require('fs');
const content = fs.readFileSync('scanned_products_rows (3).csv', 'utf8');
const lines = content.split('\n');
console.log('HEADERS:', lines[0]);

const row = lines[1];
// A very naive CSV parser just for checking columns
let inQuotes = false;
let current = '';
let cols = [];
for (let i = 0; i < row.length; i++) {
  const c = row[i];
  if (c === '"') {
    inQuotes = !inQuotes;
  } else if (c === ',' && !inQuotes) {
    cols.push(current);
    current = '';
  } else {
    current += c;
  }
}
cols.push(current);

console.log('--- COLUMNS ---');
cols.forEach((col, i) => console.log(`${i}: ${col.substring(0, 50)}`));

const fs = require('fs');

const files = ['cid_5713.html', 'cid_2510.html', 'place_data.html', 'cid_1640.html', 'sport.html'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  console.log('====================================');
  console.log('FILE:', file);

  // Search for coordinates (look for -8.xxxx and -34.xxxx in close proximity or within an array)
  // Usually, coordinates are like: [-8.027421, -34.9085489] or similar
  // Let's search for matches of numbers -8.xxxx and -34.xxxx
  const latRegex = /-8\.\d+/g;
  const lngRegex = /-34\.\d+/g;
  
  const lats = [...new Set(content.match(latRegex) || [])];
  const lngs = [...new Set(content.match(lngRegex) || [])];
  console.log('  -> Coordinates found:', { lats: lats.slice(0, 5), lngs: lngs.slice(0, 5) });

  // Let's find any text matches of: Recife, Pernambuco, PE, Rua, Avenida
  // Google Maps has script tags with data window.APP_INITIALIZATION_STATE=...
  // Let's search for "Recife" or "Pernambuco" or "PE" and get the surrounding 100 characters
  const index = content.indexOf('Recife');
  if (index !== -1) {
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + 150);
    console.log('  -> Snippet near Recife:', content.substring(start, end).replace(/\s+/g, ' '));
  } else {
    console.log('  -> "Recife" not found');
  }

  // Let's search for common neighborhoods or field names in Recife
  const names = ['Setúbal', 'Oficiais', 'Janga', 'Arraial', 'Candeias', 'Sport', 'Internacional', 'Derby', 'Madalena', 'Boa Viagem', 'Olinda', 'Paulista', 'Jaboatão'];
  const foundNames = [];
  for (const n of names) {
    if (content.toLowerCase().includes(n.toLowerCase())) {
      foundNames.push(n);
    }
  }
  console.log('  -> Found names:', foundNames.join(', '));
}

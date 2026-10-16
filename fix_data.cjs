const fs = require('fs');
const d = JSON.parse(fs.readFileSync('./lglm_recovered_backup.json', 'utf8'));

console.log('=== Fixing corrupted data ===\n');

let fixes = 0;

// Fix reservations with null numeric fields
if (Array.isArray(d.reservations)) {
  d.reservations.forEach((r, i) => {
    const numFields = ['totalAmount', 'advancePaid', 'remainingAmount', 'pricePerDay', 'deposit', 'days'];
    numFields.forEach(field => {
      if (r[field] === null || r[field] === undefined || typeof r[field] === 'string') {
        const oldVal = r[field];
        r[field] = typeof r[field] === 'string' ? parseFloat(r[field]) || 0 : 0;
        console.log(`  FIX reservation[${i}] ${r.id}: ${field} was ${JSON.stringify(oldVal)} → ${r[field]}`);
        fixes++;
      }
    });
    // Ensure string fields exist
    if (!r.clientName) { r.clientName = 'Client Inconnu'; fixes++; }
    if (!r.clientPhone) { r.clientPhone = ''; fixes++; }
    if (!r.carBrandModel) { r.carBrandModel = 'N/A'; fixes++; }
    if (!r.carRegistration) { r.carRegistration = 'N/A'; fixes++; }
    if (!r.status) { r.status = 'Location En cours'; fixes++; }
    if (!r.startDate) { r.startDate = '2026-01-01'; fixes++; }
    if (!r.endDate) { r.endDate = '2026-01-01'; fixes++; }
  });
}

// Fix cars with null fields
if (Array.isArray(d.cars)) {
  d.cars.forEach((c, i) => {
    if (!c.status) { c.status = 'Disponible'; fixes++; console.log(`  FIX car[${i}]: status was missing → Disponible`); }
    if (c.pricePerDay === null || c.pricePerDay === undefined) { c.pricePerDay = 0; fixes++; }
  });
}

// Fix revenues if not array
if (!Array.isArray(d.revenues)) {
  console.log('  FIX: revenues was not an array, reset to []');
  d.revenues = [];
  fixes++;
}

// Fix clients if not array
if (!Array.isArray(d.clients)) {
  console.log('  FIX: clients was not an array, reset to []');
  d.clients = [];
  fixes++;
}

// Save fixed version
const outputPath = './lglm_recovered_backup_FIXED.json';
fs.writeFileSync(outputPath, JSON.stringify(d, null, 2), 'utf8');

console.log(`\n=== Done: ${fixes} fixes applied ===`);
console.log(`Saved to: ${outputPath}`);
console.log('\nImport this FIXED file in your app via Paramètres → Importer');

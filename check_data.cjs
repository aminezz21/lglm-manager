const fs = require('fs');
const d = JSON.parse(fs.readFileSync('./lglm_recovered_backup.json', 'utf8'));

console.log('=== Data Integrity Check ===\n');

console.log('settings:', typeof d.settings, d.settings ? 'OK' : 'MISSING');
console.log('cars:', Array.isArray(d.cars) ? d.cars.length + ' items' : 'NOT ARRAY: ' + typeof d.cars);
console.log('clients:', Array.isArray(d.clients) ? d.clients.length + ' items' : 'NOT ARRAY: ' + typeof d.clients);
console.log('reservations:', Array.isArray(d.reservations) ? d.reservations.length + ' items' : 'NOT ARRAY: ' + typeof d.reservations);
console.log('invoices:', Array.isArray(d.invoices) ? d.invoices.length + ' items' : 'NOT ARRAY: ' + typeof d.invoices);
console.log('revenues:', Array.isArray(d.revenues) ? d.revenues.length + ' items' : 'NOT ARRAY: ' + typeof d.revenues);

// Check clients detail
if (typeof d.clients === 'string') {
  console.log('\n!!! CLIENTS IS A RAW STRING, not an array!');
  console.log('First 300 chars:', d.clients.substring(0, 300));
}

// Check revenues detail
if (typeof d.revenues === 'string') {
  console.log('\n!!! REVENUES IS A RAW STRING, not an array!');
  console.log('First 300 chars:', d.revenues.substring(0, 300));
}

// Check first reservation for missing fields
if (Array.isArray(d.reservations) && d.reservations.length > 0) {
  const r = d.reservations[0];
  console.log('\nFirst reservation sample:');
  console.log('  id:', r.id);
  console.log('  clientName:', r.clientName);
  console.log('  totalAmount:', r.totalAmount, typeof r.totalAmount);
  console.log('  advancePaid:', r.advancePaid, typeof r.advancePaid);
  console.log('  status:', r.status);
  console.log('  endDate:', r.endDate);
}

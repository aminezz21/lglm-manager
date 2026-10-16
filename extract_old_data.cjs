/**
 * Script to extract LGLM Manager data from old Electron localStorage (LevelDB).
 * 
 * Usage: node extract_old_data.cjs
 * Output: lglm_recovered_backup.json (in the same directory)
 */

const { ClassicLevel } = require('classic-level');
const path = require('path');
const fs = require('fs');

const OLD_DB_PATH = 'C:\\Users\\PC\\Downloads\\leveldb';
const OUTPUT_FILE = path.join(__dirname, 'lglm_recovered_backup.json');

// The keys used by the app in localStorage
const LGLM_KEYS = [
  'lglm_settings',
  'lglm_cars',
  'lglm_clients',
  'lglm_reservations',
  'lglm_invoices',
  'lglm_collaborators',
  'lglm_payments',
  'lglm_expenses',
  'lglm_revenues',
  'app_passcode_enabled',
  'app_passcode',
  'app_theme_dark'
];

async function extractData() {
  console.log('=== LGLM Data Recovery Tool ===');
  console.log(`Reading LevelDB from: ${OLD_DB_PATH}\n`);

  let db;
  try {
    db = new ClassicLevel(OLD_DB_PATH, { 
      createIfMissing: false,
      readOnly: true,
      valueEncoding: 'utf8'
    });
    await db.open();
  } catch (err) {
    console.error('ERROR: Could not open LevelDB. Make sure LGLM Manager is fully closed.');
    console.error(err.message);
    process.exit(1);
  }

  const recovered = {};
  let totalEntries = 0;

  console.log('Scanning all entries...\n');

  try {
    // Read ALL entries from the LevelDB
    for await (const [key, value] of db.iterator()) {
      const keyStr = key.toString();
      
      // Electron localStorage keys are prefixed with _https://... or _http://...
      // We need to find our lglm_ keys inside them
      for (const lglmKey of LGLM_KEYS) {
        if (keyStr.includes(lglmKey)) {
          let cleanValue = value.toString();
          
          // Remove potential Electron prefix bytes (first byte can be \x01 or \x00)
          if (cleanValue.charCodeAt(0) < 32) {
            cleanValue = cleanValue.substring(1);
          }

          try {
            const parsed = JSON.parse(cleanValue);
            const shortName = lglmKey.replace('lglm_', '');
            recovered[shortName] = parsed;
            
            if (Array.isArray(parsed)) {
              console.log(`  ✓ ${lglmKey}: ${parsed.length} entries found`);
            } else {
              console.log(`  ✓ ${lglmKey}: object recovered`);
            }
            totalEntries++;
          } catch (e) {
            // Store as raw string if not JSON
            recovered[lglmKey] = cleanValue;
            console.log(`  ✓ ${lglmKey}: raw value recovered`);
            totalEntries++;
          }
          break;
        }
      }
    }
  } catch (err) {
    console.error('Error reading entries:', err.message);
  }

  await db.close();

  if (totalEntries === 0) {
    console.log('\nNo LGLM data found. Dumping ALL keys for inspection...\n');
    
    // Reopen and dump all keys
    const db2 = new ClassicLevel(OLD_DB_PATH, { createIfMissing: false, readOnly: true, valueEncoding: 'utf8' });
    await db2.open();
    
    const allKeys = [];
    for await (const [key, value] of db2.iterator()) {
      const keyStr = key.toString().replace(/[^\x20-\x7E]/g, '?');
      const valPreview = value.toString().substring(0, 100).replace(/[^\x20-\x7E]/g, '?');
      allKeys.push({ key: keyStr, preview: valPreview });
    }
    await db2.close();
    
    console.log(`Found ${allKeys.length} total keys:`);
    allKeys.forEach(k => {
      console.log(`  KEY: ${k.key}`);
      console.log(`  VAL: ${k.preview}...\n`);
    });
    
    // Save raw dump
    fs.writeFileSync(OUTPUT_FILE.replace('.json', '_raw_dump.json'), JSON.stringify(allKeys, null, 2), 'utf8');
    console.log(`\nRaw dump saved to: ${OUTPUT_FILE.replace('.json', '_raw_dump.json')}`);
    return;
  }

  // Build the import-ready format (matching DBManager.importDatabase format)
  const importReady = {
    settings: recovered.settings || null,
    cars: recovered.cars || [],
    clients: recovered.clients || [],
    reservations: recovered.reservations || [],
    invoices: recovered.invoices || [],
    collaborators: recovered.collaborators || [],
    payments: recovered.payments || [],
    expenses: recovered.expenses || [],
    revenues: recovered.revenues || []
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(importReady, null, 2), 'utf8');

  console.log(`\n=== Recovery Complete ===`);
  console.log(`Total entries recovered: ${totalEntries}`);
  console.log(`Output saved to: ${OUTPUT_FILE}`);
  console.log(`\nYou can now import this file in LGLM Manager:`);
  console.log(`  → Paramètres Agence → Importer la base de données`);
}

extractData().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

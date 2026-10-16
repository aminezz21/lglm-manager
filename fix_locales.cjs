const fs = require('fs');
const path = require('path');
const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
let totalFixes = 0;

files.forEach(f => {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  let original = content;
  
  // Replace `{var.toLocaleString('fr-TN')}` with `{(Number(var) || 0).toLocaleString('fr-TN')}`
  content = content.replace(/\{([a-zA-Z0-9_.]+)\.toLocaleString\('fr-TN'\)\}/g, "{(Number($1) || 0).toLocaleString('fr-TN')}");
  
  // Replace `{var.toLocaleString('fr-TN', {maximumFractionDigits: 3})}`
  content = content.replace(/\{([a-zA-Z0-9_.]+)\.toLocaleString\('fr-TN',\s*\{maximumFractionDigits:\s*3\}\)\}/g, "{(Number($1) || 0).toLocaleString('fr-TN', {maximumFractionDigits: 3})}");

  // Replace `${var.toLocaleString('fr-TN')}` in template strings (e.g. `Paiement de ${amount.toLocaleString('fr-TN')} DT`)
  content = content.replace(/\$\{([a-zA-Z0-9_.]+)\.toLocaleString\('fr-TN'\)\}/g, "${(Number($1) || 0).toLocaleString('fr-TN')}");

  // Replace `{(var - var2).toLocaleString('fr-TN')}`
  content = content.replace(/\{\(([^)]+)\)\.toLocaleString\('fr-TN'\)\}/g, "{(Number($1) || 0).toLocaleString('fr-TN')}");
  
  if (content !== original) {
    fs.writeFileSync(p, content);
    console.log('Fixed toLocaleString calls in', f);
    totalFixes++;
  }
});
console.log('Total files fixed:', totalFixes);

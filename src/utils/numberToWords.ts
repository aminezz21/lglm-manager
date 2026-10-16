/**
 * Utility to convert numbers into French words, formatted for Tunisian Dinars.
 * Example: 300 -> "trois cents dinars"
 * Example: 252.1 -> "deux cent cinquante-deux dinars et cent millimes"
 */

const UNITS = [
  '', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
  'dix-sept', 'dix-huit', 'dix-neuf'
];

const TENS = [
  '', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante',
  'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'
];

function convertLessThanThousand(n: number): string {
  if (n === 0) return '';

  let result = '';

  // Hundreds
  const hundreds = Math.floor(n / 100);
  const remainder = n % 100;

  if (hundreds > 0) {
    if (hundreds === 1) {
      result += 'cent';
    } else {
      result += UNITS[hundreds] + ' cent';
      if (remainder === 0) {
        result += 's';
      }
    }
    if (remainder > 0) result += ' ';
  }

  if (remainder === 0) return result;

  // Less than 20
  if (remainder < 20) {
    result += UNITS[remainder];
    return result;
  }

  // 20 to 99
  const tens = Math.floor(remainder / 10);
  const units = remainder % 10;

  if (tens === 7) {
    if (units === 1) {
      result += 'soixante et onze';
    } else {
      result += 'soixante-' + UNITS[10 + units];
    }
  } else if (tens === 8) {
    if (units === 0) {
      result += 'quatre-vingts';
    } else {
      result += 'quatre-vingt-' + UNITS[units];
    }
  } else if (tens === 9) {
    result += 'quatre-vingt-' + UNITS[10 + units];
  } else {
    // 20, 30, 40, 50, 60
    if (units === 1) {
      result += TENS[tens] + ' et un';
    } else if (units > 1) {
      result += TENS[tens] + '-' + UNITS[units];
    } else {
      result += TENS[tens];
    }
  }

  return result;
}

export function numberToWordsFrench(n: number): string {
  const rounded = Math.round(n);
  if (rounded === 0) return 'zéro';
  if (rounded < 0) return 'moins ' + numberToWordsFrench(Math.abs(rounded));

  let num = rounded;
  let words = '';

  // Billions
  const billions = Math.floor(num / 1000000000);
  num %= 1000000000;
  if (billions > 0) {
    words += (billions === 1 ? 'un milliard' : convertLessThanThousand(billions) + ' milliards') + ' ';
  }

  // Millions
  const millions = Math.floor(num / 1000000);
  num %= 1000000;
  if (millions > 0) {
    words += (millions === 1 ? 'un million' : convertLessThanThousand(millions) + ' millions') + ' ';
  }

  // Thousands
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  if (thousands > 0) {
    if (thousands === 1) {
      words += 'mille ';
    } else {
      words += convertLessThanThousand(thousands) + ' mille ';
    }
  }

  // Remainder
  if (num > 0) {
    words += convertLessThanThousand(num);
  }

  return words.trim();
}

/**
 * Converts a total amount into the full legal stop phrase for invoices / quotes in Tunisian Dinars.
 * Example:
 * 300 -> "Arrêtée la présente facture à la somme de trois cents dinars."
 * 252.1 -> "Arrêtée la présente facture à la somme de deux cent cinquante-deux dinars et cent millimes."
 */
export function formatLegalAmountInWords(
  amount: number,
  docType: 'Facture' | 'Devis' = 'Facture'
): string {
  const safeAmount = Math.max(0, Number(amount) || 0);
  const dinars = Math.floor(safeAmount);
  // Get millimes (3 decimal places in Tunisia: 1 Dinar = 1000 Millimes)
  const decimals = Math.round((safeAmount - dinars) * 1000);

  const dinarsWord = numberToWordsFrench(dinars);
  const dinarUnit = dinars > 1 ? 'dinars' : 'dinar';

  let fullWords = `${dinarsWord} ${dinarUnit}`;

  if (decimals > 0) {
    const millimesWord = numberToWordsFrench(decimals);
    const millimeUnit = decimals > 1 ? 'millimes' : 'millime';
    fullWords += ` et ${millimesWord} ${millimeUnit}`;
  }

  const prefix = docType === 'Devis' 
    ? 'Arrêté le présent devis à la somme de' 
    : 'Arrêtée la présente facture à la somme de';

  return `${prefix} ${fullWords}.`;
}

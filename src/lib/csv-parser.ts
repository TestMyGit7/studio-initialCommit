export interface ParsedCsvData {
  headers: string[];
  data: Record<string, string>[];
}

// Helper to parse a single CSV line, handling basic quoting and escaped quotes
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
        // Escaped quote (e.g., "" inside a quoted field)
        currentVal += '"';
        i++; // Skip the second quote of the pair
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentVal);
      currentVal = '';
    } else {
      currentVal += char;
    }
  }
  values.push(currentVal); // Add the last value

  // Trim whitespace from unquoted values, or if quotes were only for wrapping.
  // For truly quoted values that should preserve internal whitespace, this might be too aggressive.
  // However, for most CSVs, trimming is desired.
  return values.map(val => {
    if (val.startsWith('"') && val.endsWith('"')) {
      return val.substring(1, val.length - 1).replace(/""/g, '"');
    }
    return val.trim();
  });
}


export function parseCSV(csvText: string): ParsedCsvData {
  const lines = csvText.trim().split(/\r\n|\n/); // Handles both CRLF and LF line endings
  if (lines.length === 0) {
    return { headers: [], data: [] };
  }

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim());
  
  const uniqueHeaders = headers.map((header, index) => {
    let count = 1;
    let newHeader = header;
    // Ensure header uniqueness if duplicates exist
    while (headers.slice(0, index).includes(newHeader) || newHeader === '') {
      newHeader = header === '' ? `UnnamedColumn${count}` : `${header}_${count}`;
      count++;
    }
    return newHeader;
  });


  const data: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue; // Skip empty lines
    
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    
    uniqueHeaders.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index] : '';
    });
    data.push(row);
  }

  return { headers: uniqueHeaders, data };
}

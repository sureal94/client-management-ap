import { describe, it, expect } from 'vitest';

// Import the parsing function (we'll need to export it from import.js)
function parseTableFromText(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  let headerLine = -1;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const parts = lines[i].split(/\s+/).filter(p => p.trim());
    if (parts.length >= 3) {
      headerLine = i;
      break;
    }
  }

  if (headerLine === -1) return [];

  const headers = lines[headerLine].split(/\s+/).filter(h => h.trim());
  const data = [];

  for (let i = headerLine + 1; i < lines.length; i++) {
    const parts = lines[i].split(/\s+/).filter(p => p.trim());
    if (parts.length >= 2) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = parts[index] || '';
      });
      data.push(row);
    }
  }

  return data;
}

describe('parseTableFromText', () => {
  it('should parse simple table from text', () => {
    const text = `Name Code Price
Product1 ABC123 100
Product2 DEF456 200`;

    const result = parseTableFromText(text);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      Name: 'Product1',
      Code: 'ABC123',
      Price: '100',
    });
    expect(result[1]).toEqual({
      Name: 'Product2',
      Code: 'DEF456',
      Price: '200',
    });
  });

  it('should return empty array for empty text', () => {
    expect(parseTableFromText('')).toEqual([]);
    expect(parseTableFromText('\n\n')).toEqual([]);
  });

  it('should skip lines with insufficient columns', () => {
    const text = `Name Code Price
Short
Product1 ABC123 100
Product2 DEF456 200`;

    const result = parseTableFromText(text);
    expect(result).toHaveLength(2);
  });

  it('should handle extra whitespace', () => {
    const text = `Name    Code    Price
Product1   ABC123   100
Product2   DEF456   200`;

    const result = parseTableFromText(text);
    expect(result).toHaveLength(2);
    expect(result[0].Name.trim()).toBe('Product1');
  });

  it('should handle missing values in rows', () => {
    const text = `Name Code Price
Product1 ABC123
Product2 DEF456 200`;

    const result = parseTableFromText(text);
    expect(result).toHaveLength(2);
    expect(result[0].Price).toBe('');
    expect(result[1].Price).toBe('200');
  });
});





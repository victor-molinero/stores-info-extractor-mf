import { CATEGORY_OPTION_SET, DEFAULT_CATEGORY } from './config.js';

export function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildCsv(rows, mode) {
  const lines = [mode.csvColumns.map(escapeCsvValue).join(",")];

  rows.forEach((row) => {
    lines.push(mode.csvRow(row).map(escapeCsvValue).join(","));
  });

  return `\uFEFF${lines.join("\n")}`;
}

export function normalizeCategoryValue(category) {
  return CATEGORY_OPTION_SET.has(category) ? category : DEFAULT_CATEGORY;
}

export function toRowsForMode(mode, sourceRows) {
  return sourceRows.map((row) => mode.normalize(row));
}

export function mergeUniqueRows(mode, existingRows, incomingRows) {
  if (!mode.appendMode) {
    const deduped = [];
    const keys = new Set();
    incomingRows.forEach((row) => {
      const key = mode.rowKey(row);
      if (!keys.has(key)) {
        keys.add(key);
        deduped.push(row);
      }
    });
    return { rows: deduped, addedCount: deduped.length };
  }

  const merged = [...existingRows];
  const keys = new Set(existingRows.map((row) => mode.rowKey(row)));
  let addedCount = 0;

  incomingRows.forEach((row) => {
    const key = mode.rowKey(row);
    if (!keys.has(key)) {
      keys.add(key);
      merged.push(row);
      addedCount += 1;
    }
  });

  return { rows: merged, addedCount };
}

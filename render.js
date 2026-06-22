import { CATEGORY_OPTIONS, CATEGORY_OPTION_SET, DEFAULT_CATEGORY } from './config.js';
import { getStoredRows } from './storage.js';
import { normalizeCategoryValue } from './utils.js';

// Cache DOM elements
const modeHelpEl = document.getElementById("mode-help");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const tableHeadRowEl = document.getElementById("table-head-row");
const rowsBodyEl = document.getElementById("rows-body");
const downloadButton = document.getElementById("download");

export function setStatus(message) {
  statusEl.textContent = message;
}

export function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text || "";
  return cell;
}

export function createCategoryCell(category, rowIndex) {
  const cell = document.createElement("td");
  const select = document.createElement("select");
  select.className = "category-select";
  select.dataset.rowIndex = String(rowIndex);
  select.setAttribute("aria-label", "Select category");

  CATEGORY_OPTIONS.forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    option.selected = optionValue === normalizeCategoryValue(category);
    select.appendChild(option);
  });

  cell.appendChild(select);
  return cell;
}

export function renderTableHeader(mode) {
  tableHeadRowEl.replaceChildren();

  mode.columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column.label;
    tableHeadRowEl.appendChild(th);
  });

  const actionsTh = document.createElement("th");
  actionsTh.textContent = "Actions";
  tableHeadRowEl.appendChild(actionsTh);
}

export function renderRows(rows, mode) {
  countEl.textContent = `${rows.length} row${rows.length === 1 ? "" : "s"} saved`;
  downloadButton.disabled = rows.length === 0;

  rowsBodyEl.replaceChildren();

  if (rows.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = mode.columns.length + 1;
    emptyCell.className = "empty";
    emptyCell.textContent = "No extracted rows yet.";
    emptyRow.appendChild(emptyCell);
    rowsBodyEl.appendChild(emptyRow);
    return;
  }

  rows.forEach((row, index) => {
    const tr = document.createElement("tr");

    mode.columns.forEach((column) => {
      if (column.key === "category") {
        tr.appendChild(createCategoryCell(row[column.key], index));
      } else {
        tr.appendChild(createCell(String(row[column.key] ?? "")));
      }
    });

    const actionsCell = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-item";
    removeButton.dataset.rowIndex = String(index);
    removeButton.textContent = "Remove";
    actionsCell.appendChild(removeButton);

    tr.appendChild(actionsCell);
    rowsBodyEl.appendChild(tr);
  });
}

export async function refreshView(mode) {
  renderTableHeader(mode);
  modeHelpEl.innerHTML = `${mode.helpText} Example: <a href="${mode.urlHint}" target="_blank" rel="noopener noreferrer">${mode.urlHint}</a>`;

  const rows = await getStoredRows(mode);
  renderRows(rows, mode);
}

export function getRowsBodyElement() {
  return rowsBodyEl;
}

export function getDownloadButton() {
  return downloadButton;
}

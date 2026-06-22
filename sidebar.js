import { MODES } from './config.js';
import { getSelectedModeId, persistSelectedMode } from './storage.js';
import { refreshView } from './render.js';
import { setDOMElements, attachEventListeners, getSelectedMode } from './handlers.js';

// Get and cache DOM elements
const modeSelectEl = document.getElementById("mode-select");
const extractButton = document.getElementById("extract");
const downloadButton = document.getElementById("download");
const resetButton = document.getElementById("reset");

function populateModeSelect() {
  Object.values(MODES).forEach((mode) => {
    const option = document.createElement("option");
    option.value = mode.id;
    option.textContent = mode.label;
    modeSelectEl.appendChild(option);
  });
}

function handleModeChange() {
  modeSelectEl.addEventListener("change", async () => {
    await persistSelectedMode(modeSelectEl.value);
    const mode = getSelectedMode();
    await refreshView(mode);
  });
}

async function init() {
  // Populate mode dropdown
  populateModeSelect();

  // Restore previously selected mode
  const selectedModeId = await getSelectedModeId();
  modeSelectEl.value = selectedModeId;

  // Pass DOM elements to handlers module
  setDOMElements({
    modeSelectEl,
    extractButton,
    downloadButton,
    resetButton,
  });

  // Attach all event listeners
  attachEventListeners();

  // Handle mode changes separately to manage persistence
  handleModeChange();

  // Initial view
  const mode = getSelectedMode();
  await refreshView(mode);
}

init();

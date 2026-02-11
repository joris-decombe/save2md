// Save2MD - Popup Script

"use strict";

const includeImagesToggle = document.getElementById("includeImages");
const imageModeSelect = document.getElementById("imageMode");
const imageModeRow = document.getElementById("imageModeRow");
const saveBtn = document.getElementById("saveBtn");
const saveImagesBtn = document.getElementById("saveImagesBtn");
const statusEl = document.getElementById("status");

// Load saved settings
chrome.storage.sync.get("settings", (data) => {
  const s = data.settings || {};
  includeImagesToggle.checked = !!s.includeImages;
  imageModeSelect.value = s.imageMode || "reference";
  imageModeRow.style.display = includeImagesToggle.checked ? "flex" : "none";
});

// Toggle image mode visibility
includeImagesToggle.addEventListener("change", () => {
  imageModeRow.style.display = includeImagesToggle.checked ? "flex" : "none";
  saveSettings();
});

imageModeSelect.addEventListener("change", saveSettings);

function saveSettings() {
  chrome.storage.sync.set({
    settings: {
      includeImages: includeImagesToggle.checked,
      imageMode: imageModeSelect.value,
    },
  });
}

// Save buttons
saveBtn.addEventListener("click", () => {
  doSave({ includeImages: false });
});

saveImagesBtn.addEventListener("click", () => {
  doSave({
    includeImages: true,
    imageMode: imageModeSelect.value,
  });
});

function doSave(options) {
  statusEl.textContent = "Extracting page...";
  saveBtn.disabled = true;
  saveImagesBtn.disabled = true;

  chrome.runtime.sendMessage(
    { action: "save-from-popup", options },
    (response) => {
      if (response?.success) {
        statusEl.textContent = "Download started!";
        setTimeout(() => window.close(), 1200);
      } else {
        statusEl.textContent = "Error: " + (response?.error || "unknown");
        saveBtn.disabled = false;
        saveImagesBtn.disabled = false;
      }
    }
  );
}

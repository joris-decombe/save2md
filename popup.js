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
  setStatus("Extracting page...", false);
  saveBtn.disabled = true;
  saveImagesBtn.disabled = true;

  chrome.runtime.sendMessage(
    { action: "save-from-popup", options },
    (response) => {
      if (chrome.runtime.lastError) {
        setStatus("Error: could not reach page", true);
        saveBtn.disabled = false;
        saveImagesBtn.disabled = false;
        return;
      }
      if (response?.success) {
        setStatus("Download started!", false);
        setTimeout(() => window.close(), 1200);
      } else {
        setStatus("Error: " + (response?.error || "unknown"), true);
        saveBtn.disabled = false;
        saveImagesBtn.disabled = false;
      }
    }
  );
}

function setStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

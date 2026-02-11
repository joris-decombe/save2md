// Save2MD - Background Service Worker
// Manages context menus and coordinates content extraction + file download

"use strict";

// ---- Context menu setup ----
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save2md",
    title: "Save page as Markdown",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "save2md-images",
    title: "Save page as Markdown (with images)",
    contexts: ["page"],
  });

  // Initialise default settings
  chrome.storage.sync.get("settings", (data) => {
    if (!data.settings) {
      chrome.storage.sync.set({
        settings: {
          includeImages: false,
          imageMode: "reference", // "reference" | "datauri"
        },
      });
    }
  });
});

// ---- Context menu click handler ----
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;

  const includeImages = info.menuItemId === "save2md-images";
  triggerExtraction(tab, { includeImages });
});

// ---- Message handler (from popup) ----
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "save-from-popup") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        sendResponse({ success: false, error: "No active tab" });
        return;
      }
      triggerExtraction(tab, msg.options || {});
      sendResponse({ success: true });
    });
    return true; // async
  }
});

// ---- Core extraction + download flow ----
async function triggerExtraction(tab, options) {
  try {
    // Ensure content script is injected (handles pages opened before install)
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
    } catch {
      // Already injected or cannot inject – continue and hope for the best
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "extract",
      options,
    });

    if (!response || !response.success) {
      console.error("Save2MD: extraction failed", response?.error);
      return;
    }

    let markdown = response.markdown;

    // If images requested with data-uri mode, fetch and embed them
    if (options.includeImages && options.imageMode === "datauri" && response.images?.length) {
      markdown = await embedImagesAsDataUri(markdown, response.images);
    }

    // Download the markdown file
    const filename = sanitizeFilename(response.title || "page") + ".md";
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download(
      {
        url,
        filename,
        saveAs: true,
      },
      () => {
        // Revoke after a short delay to ensure download starts
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    );
  } catch (err) {
    console.error("Save2MD: error during extraction", err);
  }
}

// ---- Helpers ----

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // remove illegal chars
    .replace(/\s+/g, "-")                     // spaces → hyphens
    .replace(/-+/g, "-")                       // collapse hyphens
    .replace(/^-|-$/g, "")                     // trim hyphens
    .substring(0, 200);                        // cap length
}

async function embedImagesAsDataUri(markdown, images) {
  // For each image, try to fetch and convert to data URI
  const cache = new Map();

  for (const img of images) {
    if (cache.has(img.src)) continue;
    try {
      const resp = await fetch(img.src);
      if (!resp.ok) continue;
      const blob = await resp.blob();
      const dataUri = await blobToDataUri(blob);
      cache.set(img.src, dataUri);
    } catch {
      // Skip images that can't be fetched (CORS etc.)
    }
  }

  // Replace URLs in markdown
  let result = markdown;
  for (const [originalUrl, dataUri] of cache) {
    // Replace all occurrences of the URL (they appear inside ![alt](url))
    result = result.split(originalUrl).join(dataUri);
  }

  return result;
}

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

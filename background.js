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
          imageMode: "reference",
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
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        sendResponse({ success: false, error: "No active tab" });
        return;
      }
      try {
        await triggerExtraction(tab, msg.options || {});
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true; // async
  }
});

// ---- Core extraction + download flow ----
async function triggerExtraction(tab, options) {
  // Inject content script on demand (activeTab grants access after user gesture)
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  } catch {
    // May fail if already injected or page is restricted (chrome://, etc.)
  }

  const response = await chrome.tabs.sendMessage(tab.id, {
    action: "extract",
    options,
  });

  if (!response || !response.success) {
    throw new Error(response?.error || "Extraction failed");
  }

  let markdown = response.markdown;

  // If images requested with data-uri mode, fetch and embed them
  if (options.includeImages && options.imageMode === "datauri" && response.images?.length) {
    markdown = await embedImagesAsDataUri(markdown, response.images);
  }

  // Download the markdown file using a data: URI (works in service workers)
  const filename = sanitizeFilename(response.title || "page") + ".md";
  const dataUrl = "data:text/markdown;charset=utf-8," + encodeURIComponent(markdown);

  await chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: true,
  });
}

// ---- Helpers ----

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 200);
}

async function embedImagesAsDataUri(markdown, images) {
  const cache = new Map();

  for (const img of images) {
    if (cache.has(img.src)) continue;
    try {
      const resp = await fetch(img.src);
      if (!resp.ok) continue;
      const buf = await resp.arrayBuffer();
      const contentType = resp.headers.get("content-type") || "image/png";
      const base64 = arrayBufferToBase64(buf);
      cache.set(img.src, `data:${contentType};base64,${base64}`);
    } catch {
      // Skip images that can't be fetched (CORS etc.)
    }
  }

  let result = markdown;
  for (const [originalUrl, dataUri] of cache) {
    result = result.split(originalUrl).join(dataUri);
  }

  return result;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

#!/usr/bin/env node
import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const storeDir = path.join(root, "store");

// Ensure store directory exists
if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, { recursive: true });
}

function fileUrl(filePath) {
  return "file://" + filePath.replace(/\\/g, "/");
}

async function takeScreenshots() {
  const browser = await chromium.launch({
    args: ["--disable-gpu", "--disable-software-rasterizer"],
  });

  try {
    console.log("Taking store screenshots for Save2MD...\n");

    // ---- Store icon (128x128, no alpha) ----
    console.log("  1. Store icon (128x128)...");
    const iconPage = await browser.newPage({
      viewport: { width: 128, height: 128 },
    });
    // Embed icon as data URI to avoid file:// loading issues with setContent
    const iconData = fs.readFileSync(path.join(root, "icons", "icon128.png"));
    const iconDataUri = "data:image/png;base64," + iconData.toString("base64");
    await iconPage.setContent(`
      <html><body style="margin:0; padding:0; width:128px; height:128px; background:#fff;">
        <img src="${iconDataUri}" style="display:block; width:128px; height:128px;">
      </body></html>
    `);
    await iconPage.waitForLoadState("networkidle");
    await iconPage.waitForLoadState("networkidle");
    await iconPage.screenshot({
      path: path.join(storeDir, "icon-128x128.png"),
    });
    await iconPage.close();
    console.log("     -> store/icon-128x128.png");

    // ---- Screenshot (1280x800) ----
    console.log("  2. Screenshot (1280x800)...");
    const screenshotPage = await browser.newPage({
      viewport: { width: 1280, height: 800 },
    });
    await screenshotPage.goto(fileUrl(path.join(storeDir, "screenshot.html")));
    await screenshotPage.waitForLoadState("networkidle");
    await screenshotPage.screenshot({
      path: path.join(storeDir, "screenshot-1280x800.png"),
    });
    await screenshotPage.close();
    console.log("     -> store/screenshot-1280x800.png");

    // ---- Small promo tile (440x280) ----
    console.log("  3. Small promo tile (440x280)...");
    const promoPage = await browser.newPage({
      viewport: { width: 440, height: 280 },
    });
    await promoPage.goto(fileUrl(path.join(storeDir, "promo-tile.html")));
    await promoPage.waitForLoadState("networkidle");
    await promoPage.screenshot({
      path: path.join(storeDir, "promo-tile-440x280.png"),
    });
    await promoPage.close();
    console.log("     -> store/promo-tile-440x280.png");

    // ---- Marquee promo tile (1400x560) ----
    console.log("  4. Marquee promo tile (1400x560)...");
    const marqueePage = await browser.newPage({
      viewport: { width: 1400, height: 560 },
    });
    await marqueePage.goto(fileUrl(path.join(storeDir, "marquee-tile.html")));
    await marqueePage.waitForLoadState("networkidle");
    await marqueePage.screenshot({
      path: path.join(storeDir, "marquee-tile-1400x560.png"),
    });
    await marqueePage.close();
    console.log("     -> store/marquee-tile-1400x560.png");

    console.log("\nDone! All store assets saved to store/");
  } catch (error) {
    console.error("Error taking screenshots:", error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

takeScreenshots().catch(console.error);

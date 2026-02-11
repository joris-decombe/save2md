# Save2MD

Save any web page as a clean Markdown file, directly from your browser.

Right-click any page and select **"Save page as Markdown"** -- or use the toolbar popup for more options. Save2MD automatically extracts the main content, filters out ads and junk, and produces well-formatted Markdown.

## Features

- **Right-click context menu** -- "Save page as Markdown" or "Save page as Markdown (with images)"
- **Smart content extraction** -- Readability-inspired algorithm finds the article body, skipping sidebars and navigation
- **Ad filtering** -- Removes ads (Google Ads, Outbrain, Taboola, etc.), cookie banners, newsletter popups, and social widgets
- **Full Markdown support** -- Headings, paragraphs, bold/italic, links, images, ordered/unordered lists, blockquotes, code blocks with syntax highlighting, tables, and more
- **Image options** -- Include images as URL references or embedded data URIs
- **Lazy-load aware** -- Picks up `data-src` and `data-lazy-src` attributes
- **Clean output** -- Front-matter with source URL and date, properly escaped Markdown

## Installation

### Chrome Web Store

> Coming soon

### Manual Install (Developer Mode)

1. Clone or download this repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `save2md` directory
5. The Save2MD icon appears in your toolbar

## Usage

### Right-Click (Context Menu)

1. Navigate to any web page
2. Right-click anywhere on the page
3. Select **"Save page as Markdown"** or **"Save page as Markdown (with images)"**
4. Choose where to save the `.md` file

### Toolbar Popup

1. Click the Save2MD icon in your toolbar
2. Toggle **Include images** if desired
3. Choose **Image mode** (URL references or embedded data URIs)
4. Click **Save as Markdown** or **Save with Images**

### Output Format

```markdown
# Page Title

> Source: https://example.com/article
> Saved: 2026-02-11

---

Article content converted to clean Markdown...
```

## How Ad Filtering Works

Save2MD removes unwanted content before conversion:

- **Ad networks** -- Google Ads, Outbrain, Taboola, MGID, DoubleClick
- **Generic ad patterns** -- Elements with `ad-`, `advert`, `sponsor`, `promoted` in class/ID names
- **Cookie/GDPR banners** -- Consent dialogs and privacy overlays
- **Social widgets** -- Share bars, social buttons, embedded social iframes
- **Newsletter popups** -- Signup prompts and subscribe modals
- **Hidden elements** -- Anything with `display: none`, `visibility: hidden`, or `opacity: 0`
- **Non-content tags** -- `<script>`, `<style>`, `<noscript>`, `<svg>`, `<nav>` (outside main content)

The main content area is identified using well-known selectors (`<article>`, `<main>`, `[role="main"]`, `.post-content`, `.entry-content`, etc.) with a fallback scoring algorithm that evaluates paragraph density, heading count, and text length.

## Permissions

Save2MD requests only the minimum permissions needed:

| Permission | Why |
|---|---|
| `contextMenus` | Add "Save as Markdown" to the right-click menu |
| `activeTab` | Access the current page content when you trigger a save |
| `scripting` | Inject the content extraction script into the active tab |
| `storage` | Remember your image preferences |
| `downloads` | Save the generated `.md` file to your computer |

No data is collected, transmitted, or stored remotely. Everything runs locally in your browser.

## Development

```bash
git clone https://github.com/joris-decombe/save2md.git
cd save2md
```

Load the extension in Chrome (see [Manual Install](#manual-install-developer-mode) above), then make changes and reload from `chrome://extensions/`.

### Project Structure

```
save2md/
├── manifest.json      # Extension manifest (Manifest V3)
├── background.js      # Service worker (context menus, download coordination)
├── content.js         # Content script (extraction, ad filtering, HTML→MD)
├── popup.html         # Toolbar popup UI
├── popup.js           # Popup logic
├── icons/             # Extension icons (16, 32, 48, 128px)
├── privacy-policy.md  # Privacy policy (required for Chrome Web Store)
├── LICENSE            # MIT License
└── .github/           # CI workflows, issue/PR templates
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to submit issues and pull requests.

## License

This project is licensed under the [MIT License](LICENSE).

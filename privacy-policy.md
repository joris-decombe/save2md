# Save2MD Privacy Policy

**Last updated:** February 11, 2026

## Overview

Save2MD is a browser extension that converts web pages to Markdown files. It is designed with privacy as a core principle.

## Data Collection

**Save2MD does not collect, transmit, or store any user data.**

Specifically:

- **No analytics or tracking** -- No usage data, telemetry, or analytics of any kind are collected
- **No network requests** -- Save2MD does not send data to any server. All processing happens locally in your browser
- **No personal information** -- No names, emails, browsing history, or identifiers are accessed or stored
- **No third-party services** -- Save2MD does not integrate with any external services or APIs

## Data Processing

When you use Save2MD:

1. The extension reads the content of the **current active tab only**, and only when you explicitly trigger a save (via right-click menu or popup button)
2. The page content is processed entirely **within your browser** to extract the main article and convert it to Markdown
3. The resulting Markdown file is saved to your computer using Chrome's built-in download mechanism
4. No copy of the page content or Markdown output is retained by the extension after the download completes

## Stored Preferences

Save2MD stores your preferences (image toggle and image mode) using Chrome's `storage.sync` API. This data:

- Contains only your two settings (include images: on/off, image mode: reference/datauri)
- Is synced across your Chrome instances if you are signed into Chrome (this is standard Chrome behavior)
- Can be cleared by uninstalling the extension

## Permissions

See the [README](README.md#permissions) for a detailed explanation of each permission and why it is needed.

## Changes to This Policy

Any changes to this privacy policy will be documented in the [CHANGELOG](CHANGELOG.md) and reflected in a new version of the extension.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/joris-decombe/save2md/issues).

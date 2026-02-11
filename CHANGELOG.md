# Changelog

All notable changes to Save2MD will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-02-11

### Added

- Unit tests (51 tests) with vitest + jsdom covering converter, content extraction, ad stripping, and filename sanitisation
- CI pipeline: Test job (Node.js 20) alongside existing Lint and Build jobs
- Store assets: screenshot, promo tiles, and descriptions for Chrome Web Store
- Playwright-based screenshot generation script (`npm run screenshots`)
- GitHub Pages deployment for privacy policy
- Branch protection on `main` requiring all CI checks to pass

## [1.0.0] - 2026-02-11

### Added

- Right-click context menu: "Save page as Markdown" and "Save page as Markdown (with images)"
- Popup UI with image toggle and image mode selector (URL reference / data URI)
- Smart content extraction using readability-like scoring heuristic
- Ad and clutter filtering (ad networks, cookie banners, social widgets, nav/sidebar)
- HTML-to-Markdown converter supporting headings, paragraphs, lists, tables, code blocks, blockquotes, links, images, definition lists, and details/summary
- Clean filename sanitisation from page title
- Front-matter metadata in output (source URL, save date)

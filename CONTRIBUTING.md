# Contributing to Save2MD

Thank you for your interest in contributing! Here's how to get started.

## Reporting Bugs

1. Check [existing issues](https://github.com/joris-decombe/save2md/issues) to avoid duplicates
2. Open a new issue using the **Bug Report** template
3. Include: browser version, extension version, the URL that caused the issue (if possible), and steps to reproduce

## Suggesting Features

Open an issue using the **Feature Request** template. Describe the use case and how the feature would work.

## Development Setup

1. Fork and clone the repository
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode**
4. Click **Load unpacked** and select your cloned `save2md` directory
5. Make changes, then click the reload button on `chrome://extensions/` to test

## Pull Request Process

1. Create a feature branch from `main` (`git checkout -b feature/my-feature`)
2. Make your changes
3. Test on at least two different types of web pages (e.g., a news article and a documentation page)
4. Ensure no new permissions are added to `manifest.json` unless discussed in the issue first
5. Submit a PR with a clear description of what changed and why

## Code Style

- Use `"use strict"` in all JavaScript files
- 2-space indentation
- No external dependencies -- the extension is self-contained
- Keep the extension lightweight; avoid adding libraries unless absolutely necessary

## Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Keep the first line under 72 characters
- Reference issue numbers where applicable (`Fixes #12`)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

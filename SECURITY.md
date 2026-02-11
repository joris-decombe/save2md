# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Save2MD, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, please email the maintainers or use [GitHub's private vulnerability reporting](https://github.com/joris-decombe/save2md/security/advisories/new).

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and aim to release a fix within 7 days for critical issues.

## Scope

The following are in scope:
- Content script injection or code execution vulnerabilities
- Data exfiltration through the extension
- Permission escalation beyond what is declared in `manifest.json`
- Cross-site scripting (XSS) through generated Markdown output

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

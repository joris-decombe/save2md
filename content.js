// Save2MD - Content Script
// Extracts clean page content, filters ads, converts to Markdown

(() => {
  "use strict";

  // Prevent double-injection when scripting.executeScript re-runs the file
  if (window.__save2md_injected) return;
  window.__save2md_injected = true;

  // ---------------------------------------------------------------------------
  // Ad / junk selectors – elements matching these are removed before conversion
  // ---------------------------------------------------------------------------
  const AD_SELECTORS = [
    // Generic ad containers
    "[class*='ad-']", "[class*='ad_']", "[class*='ads-']", "[class*='ads_']",
    "[class*='advert']", "[class*='sponsor']", "[class*='promoted']",
    "[id*='ad-']", "[id*='ad_']", "[id*='ads-']", "[id*='ads_']",
    "[id*='advert']", "[id*='sponsor']",
    // Google ads
    "ins.adsbygoogle", "[id^='google_ads']", "[id^='div-gpt-ad']",
    "[data-ad-slot]", "[data-ad-client]", "[data-adunit]",
    // Common ad networks & widgets
    "[class*='outbrain']", "[class*='taboola']", "[id*='outbrain']",
    "[id*='taboola']", "[class*='mgid']",
    // Social sharing widgets
    "[class*='share-bar']", "[class*='social-share']", "[class*='sharing-buttons']",
    // Cookie banners & overlays
    "[class*='cookie-banner']", "[class*='cookie-consent']", "[id*='cookie']",
    "[class*='gdpr']", "[id*='gdpr']",
    // Newsletter / signup popups
    "[class*='newsletter-popup']", "[class*='subscribe-modal']", "[class*='signup-prompt']",
    // Aria-labelled ads
    "[aria-label='advertisement']", "[aria-label='Advertisement']",
    // iframes that are typically ads
    "iframe[src*='doubleclick']", "iframe[src*='googlesyndication']",
    "iframe[src*='facebook.com/plugins']", "iframe[src*='platform.twitter']",
  ];

  // Selectors for elements that usually hold the main content
  const CONTENT_SELECTORS = [
    "article",
    "[role='main']",
    "main",
    ".post-content", ".entry-content", ".article-content", ".article-body",
    ".post-body", ".story-body", ".content-body",
    "#content", "#main-content", "#article-body",
    ".markdown-body",
    ".mw-parser-output",
  ];

  // -------------------------------------------------------------------------
  // Readability-lite: find the most content-rich element
  // -------------------------------------------------------------------------
  function findMainContent(doc) {
    for (const sel of CONTENT_SELECTORS) {
      const el = doc.querySelector(sel);
      if (el && el.textContent.trim().length > 200) {
        return el;
      }
    }

    const candidates = doc.querySelectorAll("div, section, article, main, td");
    let best = null;
    let bestScore = 0;

    for (const el of candidates) {
      if (el.textContent.trim().length < 100) continue;

      let score = 0;
      score += el.querySelectorAll("p").length * 3;
      score += el.querySelectorAll("h1,h2,h3,h4,h5,h6").length * 2;
      score += el.querySelectorAll("img").length;

      const cls = (el.className + " " + el.id).toLowerCase();
      if (/sidebar|menu|comment|widget/.test(cls)) {
        score -= 20;
      }
      if (/article|post|entry|content|story|body|main/.test(cls)) {
        score += 10;
      }
      score += Math.log(el.textContent.trim().length);

      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }

    return best || doc.body;
  }

  // -------------------------------------------------------------------------
  // Strip ads & junk from a cloned DOM tree
  // -------------------------------------------------------------------------
  function stripAdsAndJunk(root) {
    for (const sel of AD_SELECTORS) {
      try {
        root.querySelectorAll(sel).forEach((el) => {
          if (el === root) return;
          el.remove();
        });
      } catch {
        // Invalid selector – skip
      }
    }

    // Remove hidden elements
    root.querySelectorAll("[style]").forEach((el) => {
      const s = el.style;
      if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") {
        el.remove();
      }
    });

    // Remove non-content tags
    root.querySelectorAll("script, style, noscript, link, meta, svg").forEach((el) =>
      el.remove()
    );

    // Remove nav elements (but not inside main content areas)
    root.querySelectorAll("nav").forEach((el) => {
      if (!el.closest("article, main, [role='main']")) {
        el.remove();
      }
    });

    return root;
  }

  // -------------------------------------------------------------------------
  // HTML → Markdown conversion
  // -------------------------------------------------------------------------
  function htmlToMarkdown(element, opts = {}) {
    const includeImages = opts.includeImages !== false;
    const images = [];

    function escapeMarkdown(text) {
      return text
        .replace(/\\/g, "\\\\")
        .replace(/([*_`\[\]()#+\-.!|{}])/g, "\\$1");
    }

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.replace(/\s+/g, " ");
        // Escape markdown special chars in plain text
        return escapeMarkdown(text);
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return "";

      const tag = node.tagName.toLowerCase();

      if (["script", "style", "noscript", "button", "input", "form", "select", "textarea"].includes(tag)) {
        return "";
      }

      const children = Array.from(node.childNodes).map(processNode).join("");

      switch (tag) {
        case "h1": return `\n\n# ${children.trim()}\n\n`;
        case "h2": return `\n\n## ${children.trim()}\n\n`;
        case "h3": return `\n\n### ${children.trim()}\n\n`;
        case "h4": return `\n\n#### ${children.trim()}\n\n`;
        case "h5": return `\n\n##### ${children.trim()}\n\n`;
        case "h6": return `\n\n###### ${children.trim()}\n\n`;

        case "p": return `\n\n${children.trim()}\n\n`;
        case "br": return "\n";
        case "hr": return "\n\n---\n\n";

        case "strong":
        case "b": {
          const t = children.trim();
          return t ? `**${t}**` : "";
        }
        case "em":
        case "i": {
          const t = children.trim();
          return t ? `*${t}*` : "";
        }
        case "del":
        case "s":
        case "strike": {
          const t = children.trim();
          return t ? `~~${t}~~` : "";
        }
        case "code": {
          // Don't escape inside inline code
          const raw = node.textContent.trim();
          return raw ? `\`${raw}\`` : "";
        }
        case "mark": {
          const t = children.trim();
          return t ? `==${t}==` : "";
        }

        case "a": {
          const href = node.getAttribute("href");
          const text = children.trim();
          if (!text) return "";
          if (!href || href.startsWith("javascript:") || href === "#") return text;
          let fullHref = href;
          try {
            fullHref = new URL(href, document.baseURI).href;
          } catch {
            // keep as-is
          }
          return `[${text}](${fullHref})`;
        }

        case "img": {
          if (!includeImages) return "";
          let src = node.getAttribute("src") ||
                    node.getAttribute("data-src") ||
                    node.getAttribute("data-lazy-src") || "";
          const alt = node.getAttribute("alt") || "";
          if (!src) return "";
          try {
            src = new URL(src, document.baseURI).href;
          } catch {
            // keep as-is
          }
          images.push({ src, alt });
          return `![${alt}](${src})`;
        }

        case "figure": return `\n\n${children.trim()}\n\n`;
        case "figcaption": return `\n*${children.trim()}*\n`;

        case "ul":
        case "ol": {
          const items = [];
          let idx = 1;
          node.childNodes.forEach((child) => {
            if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === "li") {
              const bullet = tag === "ol" ? `${idx}. ` : "- ";
              const content = processNode(child).trim();
              if (content) {
                const indented = content.replace(/\n/g, "\n  ");
                items.push(`${bullet}${indented}`);
                idx++;
              }
            }
          });
          return `\n\n${items.join("\n")}\n\n`;
        }
        case "li": return children;

        case "blockquote": {
          const lines = children.trim().split("\n");
          return `\n\n${lines.map((l) => `> ${l}`).join("\n")}\n\n`;
        }

        case "pre": {
          const codeEl = node.querySelector("code");
          // Use raw textContent for code blocks (no markdown escaping)
          const codeText = (codeEl || node).textContent.trim();
          let lang = "";
          if (codeEl) {
            const cls = codeEl.className || "";
            const m = cls.match(/(?:language|lang)-(\w+)/);
            if (m) lang = m[1];
          }
          return `\n\n\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
        }

        case "table": {
          return `\n\n${convertTable(node)}\n\n`;
        }

        case "dl": return `\n\n${children}\n\n`;
        case "dt": return `\n**${children.trim()}**\n`;
        case "dd": return `: ${children.trim()}\n`;

        case "details": return `\n\n${children}\n\n`;
        case "summary": return `**${children.trim()}**\n\n`;

        case "div":
        case "section":
        case "article":
        case "main":
        case "header":
        case "footer":
        case "aside":
        case "span":
        case "time":
        case "small":
        case "sup":
        case "sub":
        case "abbr":
          return children;

        default:
          return children;
      }
    }

    function convertTable(table) {
      const rows = [];
      table.querySelectorAll("tr").forEach((tr) => {
        const cells = [];
        tr.querySelectorAll("th, td").forEach((cell) => {
          cells.push(processNode(cell).trim().replace(/\|/g, "\\|").replace(/\n/g, " "));
        });
        rows.push(cells);
      });

      if (rows.length === 0) return "";

      const colCount = Math.max(...rows.map((r) => r.length));
      const padded = rows.map((r) => {
        while (r.length < colCount) r.push("");
        return r;
      });

      const lines = [];
      lines.push(`| ${padded[0].join(" | ")} |`);
      lines.push(`| ${padded[0].map(() => "---").join(" | ")} |`);
      for (let i = 1; i < padded.length; i++) {
        lines.push(`| ${padded[i].join(" | ")} |`);
      }
      return lines.join("\n");
    }

    const rawMd = processNode(element);

    let md = rawMd
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s+/, "")
      .replace(/\s+$/, "")
      .replace(/ +/g, " ");

    return { markdown: md, images };
  }

  // -------------------------------------------------------------------------
  // Main extraction entry point
  // -------------------------------------------------------------------------
  function extractPage(options = {}) {
    const includeImages = options.includeImages !== false;

    const clone = document.cloneNode(true);
    stripAdsAndJunk(clone);
    const mainContent = findMainContent(clone);
    const { markdown, images } = htmlToMarkdown(mainContent, { includeImages });

    const title = document.title || "Untitled";
    const url = document.location.href;
    const date = new Date().toISOString().split("T")[0];

    let md = `# ${title}\n\n`;
    md += `> Source: ${url}\n`;
    md += `> Saved: ${date}\n\n`;
    md += `---\n\n`;
    md += markdown;

    return { markdown: md, title, url, images };
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === "extract") {
      try {
        const result = extractPage(msg.options || {});
        sendResponse({ success: true, ...result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }
  });
})();

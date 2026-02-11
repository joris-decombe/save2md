import { describe, it, expect } from "vitest";
import {
  htmlToMarkdown,
  stripAdsAndJunk,
  findMainContent,
  sanitizeFilename,
  AD_SELECTORS,
  CONTENT_SELECTORS,
} from "../lib/converter.js";

// Helper: create a DOM element from an HTML string
function html(str) {
  const tpl = document.createElement("template");
  tpl.innerHTML = str.trim();
  return tpl.content.firstChild;
}

// Helper: create a full document from HTML
function makeDoc(bodyHtml) {
  const doc = document.implementation.createHTMLDocument("test");
  doc.body.innerHTML = bodyHtml;
  return doc;
}

// =========================================================================
// htmlToMarkdown
// =========================================================================
describe("htmlToMarkdown", () => {
  describe("headings", () => {
    it("converts h1-h6 to markdown headings", () => {
      const el = html("<div><h1>One</h1><h2>Two</h2><h3>Three</h3><h4>Four</h4><h5>Five</h5><h6>Six</h6></div>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("# One");
      expect(markdown).toContain("## Two");
      expect(markdown).toContain("### Three");
      expect(markdown).toContain("#### Four");
      expect(markdown).toContain("##### Five");
      expect(markdown).toContain("###### Six");
    });
  });

  describe("paragraphs", () => {
    it("converts paragraphs with blank lines", () => {
      const el = html("<div><p>First paragraph</p><p>Second paragraph</p></div>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("First paragraph");
      expect(markdown).toContain("Second paragraph");
    });
  });

  describe("inline formatting", () => {
    it("converts bold (strong and b)", () => {
      const el = html("<div><strong>bold1</strong> and <b>bold2</b></div>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("**bold1**");
      expect(markdown).toContain("**bold2**");
    });

    it("converts italic (em and i)", () => {
      const el = html("<div><em>italic1</em> and <i>italic2</i></div>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("*italic1*");
      expect(markdown).toContain("*italic2*");
    });

    it("converts strikethrough (del, s, strike)", () => {
      const el = html("<div><del>del</del> <s>s</s> <strike>strike</strike></div>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("~~del~~");
      expect(markdown).toContain("~~s~~");
      expect(markdown).toContain("~~strike~~");
    });

    it("converts mark to highlight syntax", () => {
      const el = html("<div><mark>highlighted</mark></div>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("==highlighted==");
    });

    it("converts inline code", () => {
      const el = html("<div>Use <code>npm install</code> to install</div>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("`npm install`");
    });

    it("returns empty string for empty inline elements", () => {
      const el = html("<div><strong></strong><em></em><del></del></div>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown.trim()).toBe("");
    });
  });

  describe("links", () => {
    it("converts links with href", () => {
      const el = html('<div><a href="https://example.com">Example</a></div>');
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("[Example](https://example.com)");
    });

    it("resolves relative URLs using baseURI", () => {
      const el = html('<div><a href="/about">About</a></div>');
      const { markdown } = htmlToMarkdown(el, { baseURI: "https://example.com/" });
      expect(markdown).toContain("[About](https://example.com/about)");
    });

    it("skips javascript: hrefs but keeps text", () => {
      const el = html('<div><a href="javascript:void(0)">Click</a></div>');
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("Click");
      expect(markdown).not.toContain("[Click]");
    });

    it("skips # hrefs but keeps text", () => {
      const el = html('<div><a href="#">Top</a></div>');
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("Top");
      expect(markdown).not.toContain("[Top]");
    });

    it("returns empty for links with no text", () => {
      const el = html('<div><a href="https://example.com"></a></div>');
      const { markdown } = htmlToMarkdown(el);
      expect(markdown.trim()).toBe("");
    });
  });

  describe("images", () => {
    it("converts images with alt and src", () => {
      const el = html('<div><img src="https://example.com/img.png" alt="Photo"></div>');
      const { markdown, images } = htmlToMarkdown(el);
      expect(markdown).toContain("![Photo](https://example.com/img.png)");
      expect(images).toHaveLength(1);
      expect(images[0].src).toBe("https://example.com/img.png");
    });

    it("uses data-src as fallback", () => {
      const el = html('<div><img data-src="https://example.com/lazy.png" alt="Lazy"></div>');
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("![Lazy](https://example.com/lazy.png)");
    });

    it("excludes images when includeImages is false", () => {
      const el = html('<div><img src="https://example.com/img.png" alt="Photo"></div>');
      const { markdown, images } = htmlToMarkdown(el, { includeImages: false });
      expect(markdown.trim()).toBe("");
      expect(images).toHaveLength(0);
    });

    it("skips images with no src at all", () => {
      const el = html('<div><img alt="No source"></div>');
      const { markdown } = htmlToMarkdown(el);
      expect(markdown.trim()).toBe("");
    });
  });

  describe("lists", () => {
    it("converts unordered lists", () => {
      const el = html("<ul><li>Alpha</li><li>Beta</li></ul>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("- Alpha");
      expect(markdown).toContain("- Beta");
    });

    it("converts ordered lists", () => {
      const el = html("<ol><li>First</li><li>Second</li><li>Third</li></ol>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("1. First");
      expect(markdown).toContain("2. Second");
      expect(markdown).toContain("3. Third");
    });

    it("handles nested lists", () => {
      const el = html("<ul><li>Parent<ul><li>Child</li></ul></li></ul>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("- Parent");
      expect(markdown).toContain("- Child");
    });
  });

  describe("blockquotes", () => {
    it("converts blockquotes", () => {
      const el = html("<blockquote><p>Quoted text</p></blockquote>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("> Quoted text");
    });
  });

  describe("code blocks", () => {
    it("converts pre/code blocks", () => {
      const el = html('<pre><code class="language-js">const x = 1;</code></pre>');
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("```js\nconst x = 1;\n```");
    });

    it("handles code blocks without language", () => {
      const el = html("<pre><code>plain code</code></pre>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("```\nplain code\n```");
    });

    it("detects lang- prefix for language", () => {
      const el = html('<pre><code class="lang-python">print("hi")</code></pre>');
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("```python");
    });
  });

  describe("tables", () => {
    it("converts simple tables", () => {
      const el = html(
        "<table><tr><th>Name</th><th>Age</th></tr><tr><td>Alice</td><td>30</td></tr></table>"
      );
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("| Name | Age |");
      expect(markdown).toContain("| --- | --- |");
      expect(markdown).toContain("| Alice | 30 |");
    });
  });

  describe("filtered elements", () => {
    it("filters out script, style, button, form, input, select, textarea", () => {
      const el = html(
        "<div><p>Keep</p><script>alert(1)</script><style>.x{}</style><button>Click</button><form><input></form><select><option>x</option></select><textarea>y</textarea></div>"
      );
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toContain("Keep");
      expect(markdown).not.toContain("alert");
      expect(markdown).not.toContain("Click");
    });
  });

  describe("whitespace normalization", () => {
    it("collapses multiple blank lines", () => {
      const el = html("<div><p>A</p><p>B</p><p>C</p></div>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).not.toMatch(/\n{3,}/);
    });

    it("trims leading and trailing whitespace", () => {
      const el = html("<div><p>Content</p></div>");
      const { markdown } = htmlToMarkdown(el);
      expect(markdown).toBe(markdown.trim());
    });
  });
});

// =========================================================================
// stripAdsAndJunk
// =========================================================================
describe("stripAdsAndJunk", () => {
  it("removes elements matching ad class selectors", () => {
    const doc = makeDoc('<div class="ad-banner">Ad</div><p>Content</p>');
    stripAdsAndJunk(doc.body);
    expect(doc.body.querySelector(".ad-banner")).toBeNull();
    expect(doc.body.querySelector("p").textContent).toBe("Content");
  });

  it("removes elements with sponsor class", () => {
    const doc = makeDoc('<div class="sponsor-block">Sponsored</div><p>Real</p>');
    stripAdsAndJunk(doc.body);
    expect(doc.body.querySelector(".sponsor-block")).toBeNull();
    expect(doc.body.textContent).toContain("Real");
  });

  it("removes hidden elements (display:none)", () => {
    const doc = makeDoc('<div style="display:none">Hidden</div><p>Visible</p>');
    stripAdsAndJunk(doc.body);
    expect(doc.body.textContent).not.toContain("Hidden");
    expect(doc.body.textContent).toContain("Visible");
  });

  it("removes hidden elements (visibility:hidden)", () => {
    const doc = makeDoc('<div style="visibility:hidden">Hidden</div><p>Visible</p>');
    stripAdsAndJunk(doc.body);
    expect(doc.body.textContent).toContain("Visible");
  });

  it("removes script, style, noscript, link, meta, svg", () => {
    const doc = makeDoc(
      "<script>x</script><style>.y{}</style><noscript>z</noscript><link><meta><svg></svg><p>Keep</p>"
    );
    stripAdsAndJunk(doc.body);
    expect(doc.body.querySelector("script")).toBeNull();
    expect(doc.body.querySelector("style")).toBeNull();
    expect(doc.body.querySelector("noscript")).toBeNull();
    expect(doc.body.querySelector("link")).toBeNull();
    expect(doc.body.querySelector("meta")).toBeNull();
    expect(doc.body.querySelector("svg")).toBeNull();
    expect(doc.body.textContent).toContain("Keep");
  });

  it("removes nav elements outside main content", () => {
    const doc = makeDoc("<nav><a>Menu</a></nav><p>Content</p>");
    stripAdsAndJunk(doc.body);
    expect(doc.body.querySelector("nav")).toBeNull();
  });

  it("preserves nav inside article", () => {
    const doc = makeDoc("<article><nav><a>TOC</a></nav><p>Content</p></article>");
    stripAdsAndJunk(doc.body);
    expect(doc.body.querySelector("nav")).not.toBeNull();
  });

  it("does not remove the root element itself", () => {
    const doc = makeDoc('<div class="ad-container"><p>test</p></div>');
    // Set an ad class on body itself
    doc.body.className = "ad-wrapper";
    stripAdsAndJunk(doc.body);
    expect(doc.body).toBeTruthy();
  });
});

// =========================================================================
// findMainContent
// =========================================================================
describe("findMainContent", () => {
  it("prefers <article> with sufficient text", () => {
    const doc = makeDoc(
      `<article>${"<p>Article content here. </p>".repeat(20)}</article><div><p>Other</p></div>`
    );
    const result = findMainContent(doc);
    expect(result.tagName.toLowerCase()).toBe("article");
  });

  it("prefers [role='main']", () => {
    const doc = makeDoc(
      `<div role="main">${"<p>Main content paragraph. </p>".repeat(20)}</div><div><p>Sidebar</p></div>`
    );
    const result = findMainContent(doc);
    expect(result.getAttribute("role")).toBe("main");
  });

  it("falls back to scoring when no content selector matches", () => {
    const longText = "Word ".repeat(50);
    const doc = makeDoc(
      `<div class="sidebar"><p>Short</p></div><div class="article-text">${"<p>" + longText + "</p>".repeat(5)}</div>`
    );
    const result = findMainContent(doc);
    // Should pick the div with more content
    expect(result).toBeTruthy();
    expect(result.textContent.length).toBeGreaterThan(100);
  });

  it("falls back to body when nothing matches", () => {
    const doc = makeDoc("<span>tiny</span>");
    const result = findMainContent(doc);
    expect(result.tagName.toLowerCase()).toBe("body");
  });

  it("penalizes sidebar/menu/comment/widget classes", () => {
    const content = "<p>Paragraph. </p>".repeat(10);
    const doc = makeDoc(
      `<div class="sidebar">${content}</div><div class="main-content">${content}</div>`
    );
    const result = findMainContent(doc);
    // Should not pick the sidebar div
    expect(result.className).not.toContain("sidebar");
  });
});

// =========================================================================
// sanitizeFilename
// =========================================================================
describe("sanitizeFilename", () => {
  it("removes illegal filename characters", () => {
    expect(sanitizeFilename('file<>:"/\\|?*name')).toBe("filename");
  });

  it("replaces spaces with hyphens", () => {
    expect(sanitizeFilename("hello world")).toBe("hello-world");
  });

  it("collapses multiple hyphens", () => {
    expect(sanitizeFilename("a - - b")).toBe("a-b");
  });

  it("trims leading and trailing hyphens", () => {
    expect(sanitizeFilename(" - hello - ")).toBe("hello");
  });

  it("truncates to 200 characters", () => {
    const long = "a".repeat(300);
    expect(sanitizeFilename(long).length).toBe(200);
  });

  it("removes control characters", () => {
    expect(sanitizeFilename("hello\x00\x1fworld")).toBe("helloworld");
  });

  it("handles empty string", () => {
    expect(sanitizeFilename("")).toBe("");
  });
});

// =========================================================================
// Exported constants
// =========================================================================
describe("exported constants", () => {
  it("AD_SELECTORS is a non-empty array", () => {
    expect(Array.isArray(AD_SELECTORS)).toBe(true);
    expect(AD_SELECTORS.length).toBeGreaterThan(0);
  });

  it("CONTENT_SELECTORS is a non-empty array", () => {
    expect(Array.isArray(CONTENT_SELECTORS)).toBe(true);
    expect(CONTENT_SELECTORS.length).toBeGreaterThan(0);
  });

  it("CONTENT_SELECTORS includes article", () => {
    expect(CONTENT_SELECTORS).toContain("article");
  });
});

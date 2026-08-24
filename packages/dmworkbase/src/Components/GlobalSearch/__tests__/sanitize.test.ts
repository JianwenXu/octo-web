import { describe, expect, it } from "vitest";
import { sanitizeHighlight } from "../sanitize";

describe("sanitizeHighlight", () => {
  it("preserves mark tags while escaping other HTML", () => {
    expect(
      sanitizeHighlight('<mark>Alice</mark><script>alert("x")</script>')
    ).toBe(
      '<mark>Alice</mark>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
  });

  it("accepts case-insensitive mark tags and escapes quotes and ampersands", () => {
    expect(sanitizeHighlight("<MARK>A & B</MARK> 'quoted'"))
      .toBe("<mark>A &amp; B</mark> &#39;quoted&#39;");
  });

  it("returns an empty string unchanged", () => {
    expect(sanitizeHighlight("")).toBe("");
  });
});

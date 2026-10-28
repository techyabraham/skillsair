import { describe, expect, it } from "vitest";
import { findRef, isBot, isValidRef, isValidVisitorId, parseTrackResponse, refCookieDecision, stripRef, utmFrom } from "./referral";

describe("referral capture", () => {
  it("prefers skr, accepts legacy ref and strips both while retaining other parameters", () => {
    const url = new URL("https://skillsair.com/courses/design?utm_source=x&REF=123&tab=one&SkR=ABCDEFGH&ref=456#fees");
    expect(findRef(url)).toBe("ABCDEFGH");
    expect(stripRef(url).href).toBe("https://skillsair.com/courses/design?utm_source=x&tab=one#fees");
    expect(url.searchParams.get("REF")).toBe("123");
    expect(findRef(new URL("https://skillsair.com/?ref=123"))).toBe("123");
    expect(findRef(new URL("https://skillsair.com/"))).toBeNull();
  });

  it("rejects invalid refs and visitor ids; ignores link previews", () => {
    for (const value of ["", "../x", "a".repeat(17), "a b"]) expect(isValidRef(value)).toBe(false);
    expect(isValidRef("ABCDEFGH")).toBe(true);
    expect(isValidRef("123")).toBe(true);
    expect(isValidVisitorId("cfe12644-a3ae-48e1-b892-88db3ef1c888")).toBe(true);
    expect(isValidVisitorId("invalid")).toBe(false);
    expect(isBot("WhatsApp/2.0")).toBe(true);
    expect(isBot("Mozilla/5.0 Chrome/120")).toBe(false);
  });

  it("stores a tracked token, preserving first-click cookies on failure", () => {
    expect(refCookieDecision({ kind: "tracked", token: "signed", maxAgeSeconds: 60 }, "ABCDEFGH", "old"))
      .toEqual({ value: "signed", maxAge: 60 });
    expect(refCookieDecision({ kind: "failed" }, "abcdefgh", undefined))
      .toEqual({ value: "code:ABCDEFGH", maxAge: 30 * 86400 });
    expect(refCookieDecision({ kind: "failed" }, "ABCDEFGH", "old")).toBeNull();
    expect(refCookieDecision({ kind: "not_tracked" }, "ABCDEFGH", undefined)).toBeNull();
  });

  it("distinguishes unknown codes from service failures and malformed responses", () => {
    expect(parseTrackResponse(200, { success: true, data: { tracked: false } })).toEqual({ kind: "not_tracked" });
    expect(parseTrackResponse(500, {})).toEqual({ kind: "failed" });
    expect(parseTrackResponse(200, null)).toEqual({ kind: "failed" });
    expect(parseTrackResponse(200, { data: { tracked: true, token: "", maxAgeSeconds: 60 } })).toEqual({ kind: "failed" });
    expect(parseTrackResponse(200, { data: { tracked: true, token: "signed", maxAgeSeconds: 60 } }))
      .toEqual({ kind: "tracked", token: "signed", maxAgeSeconds: 60 });
  });

  it("bounds campaign metadata", () => {
    expect(utmFrom(new URL("https://skillsair.com/"))).toBeUndefined();
    expect(utmFrom(new URL("https://skillsair.com/?utm_source=" + "x".repeat(200)))?.source).toHaveLength(100);
  });
});

import { describe, expect, it } from "vitest";
import {
  PAST_DATE_ERROR,
  applySuggestion,
  getActiveToken,
  parseTaskInput,
  removeMatches,
  suggestOptions,
} from "./parseTaskInput";

// Fixed now (Nov 22 2026, 2pm local) so results don't depend on the run date
const NOW = new Date(2026, 10, 22, 14, 0);
const at = (y: number, m: number, d: number, h = 23, min = 59) => new Date(y, m - 1, d, h, min);
const parse = (text: string) => parseTaskInput(text, NOW);

describe("tokens", () => {
  it("parses the example from the doc", () => {
    const p = parse("doing things November 12 !high !curricular");
    expect(p.title).toBe("doing things");
    expect(p.priority).toBe("high");
    expect(p.tag).toBe("curricular");
    expect(p.due_date).toEqual(at(2027, 11, 12));
    expect(p.error).toBeUndefined();
  });

  it("handles extra-curricular and any letter case", () => {
    const p = parse("club meeting !Extra-Curricular !LOW");
    expect(p.tag).toBe("extra-curricular");
    expect(p.priority).toBe("low");
    expect(p.title).toBe("club meeting");
  });

  it("last token of a kind wins", () => {
    expect(parse("x !high !low").priority).toBe("low");
  });

  it("leaves unknown tokens in the title", () => {
    const p = parse("fix bug !urgent");
    expect(p.title).toBe("fix bug !urgent");
    expect(p.priority).toBeUndefined();
  });

  it("ignores ! that isn't a token", () => {
    expect(parse("Learn C! wow!!").title).toBe("Learn C! wow!!");
    expect(parse("x !high123").priority).toBeUndefined();
  });

  it("gives an empty title when only tokens are typed", () => {
    expect(parse("!high").title).toBe("");
  });

  it("parses plain text with no date or tokens", () => {
    const p = parse("read chapter 5");
    expect(p).toMatchObject({ title: "read chapter 5", matches: [] });
    expect(p.due_date).toBeUndefined();
  });
});

describe("date rules", () => {
  it("no year, still ahead -> this year at 23:59", () => {
    expect(parse("x December 5").due_date).toEqual(at(2026, 12, 5));
  });

  it("no year, already passed -> next year", () => {
    expect(parse("x November 12").due_date).toEqual(at(2027, 11, 12));
    expect(parse("x Jan 5").due_date).toEqual(at(2027, 1, 5));
  });

  it("today with no time -> today 23:59 (not next year)", () => {
    expect(parse("x November 22").due_date).toEqual(at(2026, 11, 22));
  });

  it("today with a time already passed -> next year", () => {
    expect(parse("x Nov 22 9am").due_date).toEqual(at(2027, 11, 22, 9, 0));
  });

  it("year typed and in the future -> kept", () => {
    const p = parse("x Jan 5 2027");
    expect(p.due_date).toEqual(at(2027, 1, 5));
    expect(p.error).toBeUndefined();
  });

  it("year typed and in the past -> error", () => {
    expect(parse("x Nov 12 2026").error).toBe(PAST_DATE_ERROR);
  });

  it("relative dates", () => {
    expect(parse("x tomorrow 3pm").due_date).toEqual(at(2026, 11, 23, 15, 0));
    expect(parse("x tomorrow").due_date).toEqual(at(2026, 11, 23));
    expect(parse("x friday").due_date).toEqual(at(2026, 11, 27)); // upcoming, not last Friday
    expect(parse("x yesterday").error).toBe(PAST_DATE_ERROR);
  });

  it("removes the date phrase from the title", () => {
    expect(parse("submit report tomorrow 3pm !high").title).toBe("submit report");
  });

  it("dismissed date (✕) stays in the title", () => {
    const p = parseTaskInput("call mom friday", NOW, { ignoreDateText: "friday" });
    expect(p.title).toBe("call mom friday");
    expect(p.due_date).toBeUndefined();
  });

  it("records where things were found", () => {
    const p = parse("study Dec 5 !high");
    expect(p.matches).toEqual(
      expect.arrayContaining([
        { kind: "priority", text: "!high", start: 12, end: 17 },
        { kind: "date", text: "Dec 5", start: 6, end: 11 },
      ]),
    );
  });
});

describe("autocomplete", () => {
  it("finds the token at the cursor", () => {
    expect(getActiveToken("study !hi", 9)).toEqual({ query: "hi", start: 6, end: 9 });
    expect(getActiveToken("study !", 7)).toEqual({ query: "", start: 6, end: 7 });
  });

  it("no token when the cursor isn't in one", () => {
    expect(getActiveToken("!high study", 11)).toBeNull();
    expect(getActiveToken("wow!", 4)).toBeNull();
  });

  it("cursor mid-word covers the whole word", () => {
    expect(getActiveToken("x !hig more", 4)).toEqual({ query: "h", start: 2, end: 6 });
  });

  it("prefix match infers from the spelling", () => {
    expect(suggestOptions("hi").map((s) => s.value)).toEqual(["high"]);
    expect(suggestOptions("ex").map((s) => s.value)).toEqual(["extra-curricular"]);
    expect(suggestOptions("")).toHaveLength(6);
  });

  it("falls back to contains when no prefix matches", () => {
    // "ri" isn't the start of any option, but is inside both curricular tags
    expect(suggestOptions("ri").map((s) => s.value)).toEqual(["curricular", "extra-curricular"]);
    // "cur" IS a prefix of "curricular", so the prefix step wins
    expect(suggestOptions("cur").map((s) => s.value)).toEqual(["curricular"]);
    expect(suggestOptions("zzz")).toEqual([]);
  });

  it("applying a suggestion completes the word and adds a space", () => {
    const token = getActiveToken("study !hi", 9)!;
    expect(applySuggestion("study !hi", token, "high")).toEqual({ text: "study !high ", cursor: 12 });
  });

  it("doesn't double the space when one already follows", () => {
    const token = getActiveToken("a !h b", 4)!;
    expect(applySuggestion("a !h b", token, "home")).toEqual({ text: "a !home b", cursor: 7 });
  });

  it("✕ on a chip removes every token of that kind", () => {
    const text = "study !high Dec 5 !low";
    expect(removeMatches(text, parse(text), "priority")).toBe("study Dec 5 ");
  });
});

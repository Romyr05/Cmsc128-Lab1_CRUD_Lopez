// Smart task input: "doing things November 12 !high !curricular"
//   -> { title: "doing things", due_date: next Nov 12 23:59, priority: "high", tag: "curricular" }
import * as chrono from "chrono-node";
import { priorities, tags, type Priority, type Tag } from "shared";
import { tagLabel } from "@/lib/tags";

export type MatchKind = "priority" | "tag" | "date";

// Where a token or date was found in the text
export type Match = { kind: MatchKind; text: string; start: number; end: number };

export type ParsedTask = {
  title: string; // text left after removing tokens and the date
  priority?: Priority;
  tag?: Tag;
  due_date?: Date; // 23:59 if no time typed
  error?: string; // blocks saving
  matches: Match[];
};

export type ParseOptions = {
  ignoreDateText?: string; // date phrase dismissed with ✕; stays in the title
};

export const PAST_DATE_ERROR = "That date has already passed";

// !word at the start or after a space, whole word only
const TOKEN_RE = /(^|\s)!([a-z-]+)(?![\w-])/gi;   // Parsing
// !word right before the cursor (can be just "!")
const ACTIVE_TOKEN_RE = /(?:^|\s)!([a-z-]*)$/i;   // Autocomplete

const isPriority = (w: string): w is Priority => (priorities as readonly string[]).includes(w);
const isTag = (w: string): w is Tag => (tags as readonly string[]).includes(w);

export function parseTaskInput(text: string, now: Date, options: ParseOptions = {}): ParsedTask {
  const matches: Match[] = [];
  let priority: Priority | undefined;
  let tag: Tag | undefined;

  // Tokens: last one of each kind wins
  for (const m of text.matchAll(TOKEN_RE)) {
    const word = m[2].toLowerCase();
    const start = m.index + m[1].length; // skip leading space
    const end = start + 1 + m[2].length;
    if (isPriority(word)) {
      priority = word;
      matches.push({ kind: "priority", text: text.slice(start, end), start, end });
    } else if (isTag(word)) {
      tag = word;
      matches.push({ kind: "tag", text: text.slice(start, end), start, end });
    } // unknown tokens stay in the title
  }

  // Replace tokens with spaces: chrono skips them and indexes stay the same
  let blanked = text;
  for (const m of matches) {
    blanked = blanked.slice(0, m.start) + " ".repeat(m.end - m.start) + blanked.slice(m.end);
  }

  // Date: first match; forwardDate makes "friday" the upcoming one
  let due_date: Date | undefined;
  let error: string | undefined;
  const found = chrono.parse(blanked, now, { forwardDate: true })[0];
  const dateText = found?.text.trim();
  if (found && dateText && dateText !== options.ignoreDateText) {
    const resolved = resolveDate(found, now);
    due_date = resolved.date;
    error = resolved.error;
    matches.push({ kind: "date", text: dateText, start: found.index, end: found.index + dateText.length });
  }

  // Title: remove matches, collapse spaces
  let title = text;
  for (const m of [...matches].sort((a, b) => b.start - a.start)) {
    title = title.slice(0, m.start) + " " + title.slice(m.end);
  }
  title = title.replace(/\s+/g, " ").trim();

  return { title, priority, tag, due_date, error, matches };
}

// No time -> 23:59. No year -> next upcoming date. Otherwise a past date is an error.
function resolveDate(found: chrono.ParsedResult, now: Date): { date: Date; error?: string } {
  const c = found.start;
  const hasTime = c.isCertain("hour");
  const hour = hasTime ? (c.get("hour") ?? 0) : 23;
  const minute = hasTime ? (c.get("minute") ?? 0) : 59;

  // No year typed ("November 12"): this year, or next year if already passed
  if (c.isCertain("month") && !c.isCertain("year")) {
    const month = c.get("month")! - 1; // chrono: 1-12, Date: 0-11
    const day = c.get("day")!;
    const thisYear = new Date(now.getFullYear(), month, day, hour, minute);
    if (thisYear >= now) return { date: thisYear };
    return { date: new Date(now.getFullYear() + 1, month, day, hour, minute) };
  }

  // Year typed or relative ("tomorrow", "yesterday"): past = error
  const date = c.date();
  if (!hasTime) date.setHours(hour, minute, 0, 0);
  else date.setSeconds(0, 0);
  if (date < now) return { date, error: PAST_DATE_ERROR };
  return { date };
}

// ---------- ! autocomplete ----------

export type ActiveToken = { query: string; start: number; end: number }; // start = index of "!"

// The !word at the cursor, or null
export function getActiveToken(text: string, cursor: number): ActiveToken | null {
  const m = ACTIVE_TOKEN_RE.exec(text.slice(0, cursor));
  if (!m) return null;
  const query = m[1];
  const rest = /^[a-z-]*/i.exec(text.slice(cursor))![0]; // cursor can be mid-word
  return { query, start: cursor - query.length - 1, end: cursor + rest.length };
}

export type Suggestion = { kind: "priority" | "tag"; value: Priority | Tag; label: string };

const ALL_SUGGESTIONS: Suggestion[] = [
  ...priorities.map((p) => ({
    kind: "priority" as const,
    value: p,
    label: p[0].toUpperCase() + p.slice(1),
  })),
  ...tags.map((t) => ({ kind: "tag" as const, value: t, label: tagLabel[t] })),
];

// Prefix matches first; if none, matches that contain the query
export function suggestOptions(query: string): Suggestion[] {
  const q = query.toLowerCase();
  const prefix = ALL_SUGGESTIONS.filter((s) => s.value.startsWith(q));
  if (prefix.length > 0) return prefix;
  return ALL_SUGGESTIONS.filter((s) => s.value.includes(q));
}

// Swap the partial token for the full one plus a space
export function applySuggestion(
  text: string,
  token: ActiveToken,
  value: string,
): { text: string; cursor: number } {
  const before = text.slice(0, token.start);
  const after = text.slice(token.end);
  const inserted = `!${value}` + (after.startsWith(" ") ? "" : " ");
  return { text: before + inserted + after, cursor: before.length + inserted.length };
}

// Remove all tokens of one kind
export function removeMatches(text: string, parsed: ParsedTask, kind: MatchKind): string {
  let out = text;
  for (const m of parsed.matches.filter((x) => x.kind === kind).sort((a, b) => b.start - a.start)) {
    out = out.slice(0, m.start) + out.slice(m.end);
  }
  return out.replace(/\s+/g, " ").trimStart();
}

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, Flag, Tag as TagIcon, X } from "lucide-react";
import { TITLE_MAX_LENGTH, type Priority } from "shared";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { priorityColor } from "@/lib/priority";
import { tagLabel } from "@/lib/tags";
import {
  applySuggestion,
  getActiveToken,
  parseTaskInput,
  removeMatches,
  suggestOptions,
  type ParsedTask,
  type Suggestion,
} from "@/lib/parseTaskInput";

type TaskChatProps = {
  listName: string; // used in the placeholder
  // Saves the task; throw to keep the typed text
  onSend: (parsed: ParsedTask) => Promise<void>;
};

const LISTBOX_ID = "task-suggestions";
const CHIPS_ID = "task-chips";

// Quick-add input: parses date, !priority and !tag as you type; "!" opens suggestions
export function TaskChat({ listName, onSend }: TaskChatProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null); // caret position to set after an edit
  const [text, setText] = useState("");
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [escaped, setEscaped] = useState(false); // Esc pressed; reset on next edit
  const [ignoreDateText, setIgnoreDateText] = useState<string>(); // date dismissed with ✕
  // Set in handlers, not during render, to keep render pure
  const [now, setNow] = useState(() => new Date());

  // Re-parse on text changes only, not cursor moves
  const parsed = useMemo(
    () => parseTaskInput(text, now, { ignoreDateText }),
    [text, now, ignoreDateText],
  );

  // Dropdown options for the !word at the cursor
  const token = getActiveToken(text, cursor);
  const suggestions = token ? suggestOptions(token.query) : [];
  const open = focused && !escaped && suggestions.length > 0;
  const active = Math.min(activeIndex, suggestions.length - 1);

  // Move the caret after React updates the input
  useLayoutEffect(() => {
    if (pendingCursor.current === null) return;
    inputRef.current?.setSelectionRange(pendingCursor.current, pendingCursor.current);
    pendingCursor.current = null;
  }, [text]);

  function updateText(next: string, nextCursor: number, moveCaret = false) {
    setText(next);
    setNow(new Date());
    setCursor(nextCursor);
    setActiveIndex(0);
    setEscaped(false);
    if (moveCaret) pendingCursor.current = nextCursor;
  }

  function pick(s: Suggestion) {
    if (!token) return;
    const next = applySuggestion(text, token, s.value);
    updateText(next.text, next.cursor, true);
  }

  function removeKind(kind: "priority" | "tag") {
    const next = removeMatches(text, parsed, kind);
    updateText(next, next.length, true);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return; // closed: Enter submits
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((active + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((active - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault(); // open: Enter picks instead of saving
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEscaped(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending || !text.trim()) return;
    // Fresh time in case the page sat open
    const fresh = parseTaskInput(text, new Date(), { ignoreDateText });
    if (fresh.error) return; // red chip shows why

    setSending(true);
    try {
      await onSend(fresh);
      updateText("", 0); // only clear on success
      setIgnoreDateText(undefined);
    } catch {
      // page shows the error; keep the text for a retry
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative mb-4">
      <Input
        ref={inputRef}
        value={text}
        onChange={(e) => updateText(e.target.value, e.target.selectionStart ?? e.target.value.length)}
        onSelect={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={`Add task to "${listName}", press Enter to save`}
        maxLength={TITLE_MAX_LENGTH}
        autoComplete="off"
        // combobox: input that controls the suggestion list
        role="combobox"
        aria-label={`Add task to ${listName}. Type ! for priority or tag`}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={LISTBOX_ID}
        aria-activedescendant={open ? `${LISTBOX_ID}-${active}` : undefined}
        aria-invalid={parsed.error ? true : undefined}
        aria-describedby={CHIPS_ID}
        className="h-10 border-transparent bg-muted shadow-none focus-visible:bg-background"
      />

      {open && (
        <ul
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Priority and tag suggestions"
          className="absolute top-11 left-0 z-10 w-60 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.value}
              id={`${LISTBOX_ID}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()} // keep focus in the input
              onClick={() => pick(s)}
              onMouseEnter={() => setActiveIndex(i)}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm",
                i === active && "bg-accent text-accent-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                {s.kind === "priority" ? (
                  <Flag className={cn("size-3.5", priorityColor[s.value as Priority])} />
                ) : (
                  <TagIcon className="size-3.5 text-muted-foreground" />
                )}
                {s.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {s.kind === "priority" ? "Priority" : "Tag"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Parsed values; aria-live announces changes */}
      <div id={CHIPS_ID} aria-live="polite" className="mt-2 flex flex-wrap gap-1.5 empty:mt-0">
        {parsed.due_date && (
          <Chip
            icon={<CalendarClock className="size-3.5" />}
            label={formatDue(parsed.due_date) + (parsed.error ? ` · ${parsed.error}` : "")}
            isError={!!parsed.error}
            removeLabel="Not a date, keep it in the title"
            onRemove={() =>
              setIgnoreDateText(parsed.matches.find((m) => m.kind === "date")?.text)
            }
          />
        )}
        {parsed.priority && (
          <Chip
            icon={<Flag className={cn("size-3.5", priorityColor[parsed.priority])} />}
            label={parsed.priority[0].toUpperCase() + parsed.priority.slice(1)}
            removeLabel="Remove priority"
            onRemove={() => removeKind("priority")}
          />
        )}
        {parsed.tag && (
          <Chip
            icon={<TagIcon className="size-3.5" />}
            label={tagLabel[parsed.tag]}
            removeLabel="Remove tag"
            onRemove={() => removeKind("tag")}
          />
        )}
      </div>
    </form>
  );
}

// e.g. "Fri, Nov 12, 2027, 11:59 PM"
function formatDue(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type ChipProps = {
  icon: React.ReactNode;
  label: string;
  removeLabel: string;
  onRemove: () => void;
  isError?: boolean;
};

// Parsed value with ✕ to remove it
function Chip({ icon, label, removeLabel, onRemove, isError = false }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2 text-xs",
        isError ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground",
      )}
    >
      {icon}
      {label}
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-foreground/10"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

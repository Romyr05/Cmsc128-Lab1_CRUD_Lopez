import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import toDatePart from "@/lib/dateHelper";

type DateTimePickerProps = {
  value: string; // "YYYY-MM-DDTHH:mm"  T -> seaparator based on ISO 8601 
  onChange: (v: string) => void;
};

//Date time Picker for those Date related functions
export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const datePart = value ? value.slice(0, 10) : "";
  const timePart = value ? value.slice(11, 16) : "";
  const selected = value ? new Date(value) : undefined;

  function handleDate(d: Date | undefined) {
    if (!d) return;
    const t = timePart || "09:00"; //Default
    onChange(`${toDatePart(d)}T${t}`);  // padding to two digits
  }

  function handleTime(t: string) {
    const dp = datePart || toDatePart(new Date());
    onChange(t ? `${dp}T${t}` : "");
  }

  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            variant="outline"
            size="sm"
            className="gap-2 font-normal"
          >
            <CalendarClock className="size-4" />
            {value ? new Date(value).toLocaleString() : "Set date"}
          </Button>
        )}
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={selected} onSelect={handleDate} />
        <div className="border-t p-2">
          <input
            type="time"
            value={timePart}
            onChange={(e) => handleTime(e.target.value)}
            className="w-full rounded border bg-transparent px-2 py-1 text-sm"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}


//  "YYYY-MM-DD" 
export default function toDatePart(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");   //pad to 02
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "YYYY-MM-DDTHH:mm" in LOCAL time (the format DateTimePicker works with).
// Don't slice the API's ISO string instead: that is UTC and would shift the time.
export function toLocalDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${toDatePart(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}



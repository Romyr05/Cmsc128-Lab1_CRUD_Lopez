
//  "YYYY-MM-DD" 
export default function toDatePart(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");   //pad to 02
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;  
}



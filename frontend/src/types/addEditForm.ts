import type { Priority, Tag } from "./task";


export type FormState = {
  title: string;
  description: string;
  due_date: string; // "YYYY-MM-DDTHH:mm"
  priority: Priority;
  tag: Tag | "none"; // "none" = no tag chosen
  completed: boolean;
}

export type Priority = "low" | "medium" | "high"

export type Tag = "curricular" | "extra-curricular" | "home"

export interface task {
  _id: string;  //Mongo db sends _id   
  title: string;
  completed: boolean;
  due_date?: string;   // dates arrive as strings over the network
  priority: Priority;
  tag?: Tag;           // one optional tag
  description?: string;
  createdAt: string;
  updatedAt: string;
}

import {Schema, Document} from "mongoose"

//Creating Schema for tasks

export enum Priority_Enum{
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface interTask extends Document{
    title: string,
    completed: boolean,
    due_date?: Date,   // May have no deadline
    priority: Priority_Enum
}

export const taskSchema = new Schema<interTask>({
    title: {
        type: String,
        required: true,
        trim: true   //Remove whitespaces
    },
    completed: {
        type: Boolean,
        default: false
    },
    due_date: {
        type: Date
    },
    priority: {
        type: String,
        enum: Object.values(Priority_Enum), // Extracts those priority enums
        default: Priority_Enum.MEDIUM,
        required: true,
    },
    
}, {timestamps: true})
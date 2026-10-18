import {Schema, Document, Types} from "mongoose"

//Creating Schema for tasks

export enum Priority_Enum{
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum Tag_Enum{
  CURRICULAR = 'curricular',
  EXTRA_CURRICULAR = 'extra-curricular',
  HOME = 'home',
}

// Needs to be Document for those _id
export interface interTask extends Document{
    title: string,
    completed: boolean,
    due_date?: Date,   // May have no deadline
    priority: Priority_Enum,
    tag?: Tag_Enum,   // One optional tag
    description?: string, // Optional Description
    deletedAt?: Date | null,  // null/absent = active; a date = soft-deleted
    owner: Types.ObjectId,  // Reference to the user who owns the task
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
    tag: {
        type: String,
        enum: Object.values(Tag_Enum),
    },
    description: {
        type: String,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',  // Reference to the User model
        required: true,
        index:true, //for faster queries 
    }

}, {timestamps: true})  
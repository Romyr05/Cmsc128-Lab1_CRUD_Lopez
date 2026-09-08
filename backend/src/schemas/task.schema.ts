import {Schema, Document} from "mongoose"

//Creating Schema for tasks

export interface interTask extends Document{
    title: string,
    completed: boolean,
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
    }
})
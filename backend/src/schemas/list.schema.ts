

import { Schema, Document, Types } from "mongoose"

//Creating Schema for collaborative lists

export enum Role_Enum {
    VIEW = "view",   // can only see tasks
    EDIT = "edit",   // can create, edit, delete tasks
}

export interface interMember {
    user: Types.ObjectId,
    role: Role_Enum,
}

// Needs to be Document for those _id
export interface interList extends Document {
    name: string,
    owner: Types.ObjectId,     // FK -> User._id; only the owner manages members
    members: interMember[],    // ids + roles only, no user data (normalized)
}

const memberSchema = new Schema<interMember>({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: Object.values(Role_Enum), required: true },
}, { _id: false })  // a member is identified by user, no separate _id needed

export const listSchema = new Schema<interList>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,    // one group list per user (enforced by the DB)
    },
    members: {
        type: [memberSchema],
        default: [],
    },
}, { timestamps: true })

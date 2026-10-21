// Collaborative lists: reading my lists, creating my list, and owner-only member management

import { Request, Response } from "express";
import { Types } from "mongoose";
import List from "../models/List.js";
import userModel from "../models/userModel.js";
import { Role_Enum } from "../schemas/list.schema.js";
import { getListRole } from "../utils/listAccess.js";

// Shape of a user after populate("...", "name email") — never includes passwordHash
type UserRef = { _id: Types.ObjectId, name: string, email: string }

// Owner-only guard for member management.
// Not in the list -> 404 ; member but not owner -> 403.
async function requireOwner(req: Request, res: Response): Promise<boolean> {
    const role = await getListRole(req.params.id as string, req.session.userId!) // checkAuth guarantees userId
    if (role === null) {
        res.status(404).json({ message: "List not found" })
        return false
    }
    if (role !== "owner") {
        res.status(403).json({ message: "Only the list owner can manage members" })
        return false
    }
    return true
}

//Read: lists I own OR have been added to (never anyone else's)
export async function getLists(req: Request, res: Response): Promise<void> {
    const me = req.session.userId!
    try {
        const lists = await List.find({ $or: [{ owner: me }, { "members.user": me }] })
            .populate<{ owner: UserRef }>("owner", "name email")   // look up names for display, not stored
            .populate<{ members: { user: UserRef, role: Role_Enum }[] }>("members.user", "name email")
            .sort({ createdAt: -1 })

        // Tell the frontend my role in each list so it can hide edit buttons for view-only members
        const result = lists.map((list) => {
            const member = list.members.find((m) => m.user._id.equals(me))
            const myRole = list.owner._id.equals(me) ? "owner" : member?.role
            return { ...list.toObject(), myRole }
        })
        res.json(result)
    } catch (error) {
        console.error("Get lists error:", error)
        res.status(500).json({ message: "Fetching lists failed" })
    }
}

//Create: my one group list
export async function createList(req: Request, res: Response): Promise<void> {
    try {
        const list = await List.create({ name: req.body.name, owner: req.session.userId })
        res.status(201).json(list)
    } catch (error: any) {
        if (error && error.code == 11000) {  // unique index on owner
            res.status(409).json({ message: "You already have a group list" })
            return
        }
        console.error("Create list error:", error)
        res.status(500).json({ message: "Create list failed" })
    }
}

// Add a member by email (owner only)
export async function addMember(req: Request, res: Response): Promise<void> {
    try {
        if (!(await requireOwner(req, res))) return

        const { email, role } = req.body
        const user = await userModel.findOne({ email })
        if (!user) {
            res.status(404).json({ message: "No user with that email" })
            return
        }
        if (user._id.equals(req.session.userId)) {
            res.status(400).json({ message: "You already own this list" })
            return
        }

        // Filter "not already a member" + $push in one operation, so duplicates can't slip in
        const list = await List.findOneAndUpdate(
            { _id: req.params.id, "members.user": { $ne: user._id } },
            { $push: { members: { user: user._id, role } } },
            { new: true }
        )
        if (!list) {
            res.status(409).json({ message: "User is already a member" })
            return
        }
        res.status(201).json(list)
    } catch (error) {
        console.error("Add member error:", error)
        res.status(500).json({ message: "Add member failed" })
    }
}

// Change a member's role (owner only)
export async function updateMemberRole(req: Request, res: Response): Promise<void> {
    try {
        if (!(await requireOwner(req, res))) return

        // "members.$" = the array element the filter matched
        const list = await List.findOneAndUpdate(
            { _id: req.params.id, "members.user": req.params.userId },
            { $set: { "members.$.role": req.body.role } },
            { new: true }
        )
        if (!list) {
            res.status(404).json({ message: "Member not found" })
            return
        }
        res.json(list)
    } catch (error) {
        console.error("Update role error:", error)
        res.status(500).json({ message: "Update role failed" })
    }
}

// Remove a member (owner only)
export async function removeMember(req: Request, res: Response): Promise<void> {
    try {
        if (!(await requireOwner(req, res))) return

        const list = await List.findOneAndUpdate(
            { _id: req.params.id, "members.user": req.params.userId },
            { $pull: { members: { user: req.params.userId } } },  // remove the matching element
            { new: true }
        )
        if (!list) {
            res.status(404).json({ message: "Member not found" })
            return
        }
        res.json(list)
    } catch (error) {
        console.error("Remove member error:", error)
        res.status(500).json({ message: "Remove member failed" })
    }
}

 import List from "../models/List.js";
import { Role_Enum } from "../schemas/list.schema.js";

export type ListRole = "owner" | Role_Enum | null

// Single source of truth for list access: owner, edit, view, or null (no access)
export async function getListRole(listId: string, userId: string): Promise<ListRole> {
    const list = await List.findById(listId)
    if (!list) return null
    // .equals() compares ObjectId by value; === would compare object vs string and always fail
    if (list.owner.equals(userId)) return "owner"
    const member = list.members.find((m) => m.user.equals(userId))
    return member ? member.role : null
}

// Owner and edit members can create/update/delete tasks; view members cannot
export function canEdit(role: ListRole): boolean {
    return role === "owner" || role === Role_Enum.EDIT
}

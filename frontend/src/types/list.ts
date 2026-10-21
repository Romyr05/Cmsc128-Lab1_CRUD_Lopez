export type Role = "view" | "edit"

// A user as the backend populates it ("name email" only, never the password hash)
export interface UserRef {
  _id: string;
  name: string;
  email: string;
}

export interface ListMember {
  user: UserRef;
  role: Role;
}

export interface GroupList {
  _id: string;
  name: string;
  owner: UserRef;
  members: ListMember[];
  myRole: "owner" | Role;   // computed by the backend for the logged-in user
}

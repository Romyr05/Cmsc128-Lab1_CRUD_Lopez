import mongoose from "mongoose";
import {userSchema,interUser} from "../schemas/user.schema.js";


const userModel = mongoose.model<interUser>("User", userSchema)



export default userModel
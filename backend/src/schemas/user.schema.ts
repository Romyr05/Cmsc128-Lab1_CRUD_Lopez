import mongoose, {Document} from "mongoose";

// Shape of data in the db

const {Schema} = mongoose

export interface interUser extends Document{
    email:string,
    name: string ,
    passwordHash: string,
    resetTokenHash?: string,
    resetTokenExpires?: Date
}

export const userSchema = new Schema<interUser>({
    email: {type: String,required:true,lowercase:true ,trim:true, unique:true},
    name: {type: String, required:true, trim:true},
    passwordHash: {type: String, required:true},
    resetTokenHash: {type: String},      // sha256 of the reset token (not the raw token)
    resetTokenExpires: {type: Date}       // when the token stops working
},{timestamps: true})



export default userSchema
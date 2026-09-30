import userModel from "../models/userModel.js"
import { Request, Response } from "express";
import argon2 from "argon2";
import crypto from "crypto";
import { sendResetEmail } from "../config/mailer.js";

// Hash a reset token the same way every time so we can compare the emailed
// raw token against what we stored.
function hashToken(raw: string): string {
    return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function register(req:Request, res:Response): Promise<void> {

    const {email,name,password} = req.body
    try {
        const passwordHash = await argon2.hash(password)
        const user = await userModel.create({email,name,passwordHash})

        req.session.userId = user.id // log the new user in immediately

        res.status(201).json({id: user.id, email: user.email, name: user.name})
    } catch (error:any) {
        
        if (error && error.code == 11000){
            res.status(409).json({ message: "Email already registered!" });
            return
        } 

        console.error("Register error", error)
        res.status(500).json({message: "Registration failed"})
    }
} 


export async function login(req: Request, res:Response): Promise<void> {

    const {email, password} = req.body

    try {
    //find user email
    const user = await userModel.findOne({email})

    if(!user){
        res.status(401).json({message: "Invalid Credentials"});
        return
    }

    //Check password in regards with that email
    const valid = await argon2.verify(user.passwordHash, password)

    if(!valid){
        res.status(401).json({message: "Invalid credentials"});
        return
    }

    req.session.userId = user.id

    res.status(200).json({id: user.id, email: user.email, name: user.name})


        
    } catch (error) {
        res.status(401).json({message:"Login failed"})
    }

}


// POST /api/auth/forgot-password
// Create a reset token, store only its hash + an expiry, and email the raw
// token as a link. Always respond the same way so attackers can't tell which
// emails are registered (no account enumeration).
export async function forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body
    try {
        const user = await userModel.findOne({ email })

        if (user) {
            const rawToken = crypto.randomBytes(32).toString("hex")
            user.resetTokenHash = hashToken(rawToken)
            user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
            await user.save()

            const link = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`
            await sendResetEmail(user.email, link)
        }

        res.status(200).json({ message: "If that email exists, a reset link was sent." })
    } catch (error) {
        console.error("Forgot password error", error)
        res.status(500).json({ message: "Could not process request" })
    }
}


// POST /api/auth/reset-password
// Verify the token (hash match + not expired), set the new password, and
// clear the token so the link can't be reused.
export async function resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body
    try {
        const user = await userModel.findOne({
            resetTokenHash: hashToken(token),
            resetTokenExpires: { $gt: new Date() },
        })

        if (!user) {
            res.status(400).json({ message: "Invalid or expired reset link" })
            return
        }

        user.passwordHash = await argon2.hash(password)
        user.resetTokenHash = undefined
        user.resetTokenExpires = undefined
        await user.save()

        res.status(200).json({ message: "Password updated" })
    } catch (error) {
        console.error("Reset password error", error)
        res.status(500).json({ message: "Password reset failed" })
    }
}


// GET /api/auth/me
// report the logged-in user so the frontend can restore
// its auth state from the session cookie after a refresh.
export async function me(req: Request, res: Response): Promise<void> {
    try {
        const user = await userModel.findById(req.session.userId)

        if (!user) {
            res.status(401).json({ message: "Not authenticated" })
            return
        }

        res.status(200).json({ id: user.id, email: user.email, name: user.name })
    } catch (error) {
        console.error("Me error", error)
        res.status(500).json({ message: "Failed to load session" })
    }
}


// POST /api/auth/logout 
// destroy the session and clear the cookie.
export function logout(req: Request, res: Response): void {
    req.session.destroy((error) => {
        if (error) {
            res.status(500).json({ message: "Logout failed" })
            return
        }
        res.clearCookie("connect.sid")  // Session ID
        res.status(200).json({ message: "Logged out" })
    })
}



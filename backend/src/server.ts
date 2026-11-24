import express from "express";
import { Request, Response } from "express";
import cors from "cors"
import 'dotenv/config';
import { connectDB } from "./config/db.js";
import taskRoutes from "./routes/task.routes.js"
import authRoutes from "./routes/auth.routes.js"
import listRoutes from "./routes/list.routes.js"
import MongoStore from "connect-mongo";
import session from "express-session";
import mongoose from "mongoose";

await connectDB()

const app = express()
const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) throw new Error("SESSION_SECRET missing from .env")
const port = process.env.PORT || 5000;
// One lifetime for both the cookie and the DB session, so they can't drift apart
const SESSION_DAYS = 14
const isProduction = process.env.NODE_ENV === "production"

// Render/Vercel terminate HTTPS in front of us; trust their X-Forwarded-Proto
// so Express knows the request was HTTPS and will set the secure cookie
app.set("trust proxy", 1)

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true, // allow the session cookie to be sent cross-origin
})) //cors
app.use(express.json()) //middleware 
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        client: mongoose.connection.getClient(),
        ttl: SESSION_DAYS * 24 * 60 * 60, // seconds
    }),
    cookie: {
        maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000, // milliseconds; same lifetime as the store
        httpOnly: true,
        secure: isProduction, // HTTPS-only cookie when deployed
        sameSite: "lax", // first-party: Vercel rewrites /api to Render, so the browser sees one site
    },

}))

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/lists", listRoutes);


app.get("/",(_: Request, res: Response) => {
    res.send("testing Backend")
});

app.listen(port, () => {
    console.log(`Server running on ${port}`);
    
})
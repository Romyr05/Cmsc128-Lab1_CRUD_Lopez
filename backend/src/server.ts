import express from "express";
import { Request, Response } from "express";
import cors from "cors"
import 'dotenv/config';
import { connectDB } from "./config/db.js";
import taskRoutes from "./routes/task.routes.js"
import authRoutes from "./routes/auth.routes.js"
import MongoStore from "connect-mongo";
import session from "express-session";
import mongoose from "mongoose";

await connectDB()

const app = express()
const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) throw new Error("SESSION_SECRET missing from .env")
const port = process.env.PORT || 5000;

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
        ttl: 14 * 24 * 60 * 60, //14 days
    }),
    cookie: {
        maxAge: 1000 *60 * 60 // 1 hour
    },

}))

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);


app.get("/",(_: Request, res: Response) => {
    res.send("testing Backend")
});

app.listen(port, () => {
    console.log(`Server running on ${port}`);
    
})
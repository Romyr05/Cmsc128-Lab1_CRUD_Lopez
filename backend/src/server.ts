import express from "express";
import { Request, Response } from "express";
import 'dotenv/config';
import { connectDB } from "./config/db";


await connectDB()

const app = express()
const port = process.env.PORT || 5000;


app.get("/",(req: Request, res: Response) => {
    res.send("testing Backend")
});

app.listen(port, () => {
    console.log(`Server running on ${port}`);
    
})
import express from "express";
import { Request, Response } from "express";
import cors from "cors"
import 'dotenv/config';
import { connectDB } from "./config/db.js";
import taskRoutes from "./routes/task.routes.js"


await connectDB()

const app = express()
const port = process.env.PORT || 5000;

app.use(cors()) //cors
app.use(express.json()) //middleware

app.use("/api/tasks", taskRoutes);


app.get("/",(_: Request, res: Response) => {
    res.send("testing Backend")
});

app.listen(port, () => {
    console.log(`Server running on ${port}`);
    
})
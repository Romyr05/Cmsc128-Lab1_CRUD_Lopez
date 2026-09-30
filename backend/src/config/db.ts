import mongoose from "mongoose";


export async function connectDB(): Promise<void> {
    const uri = process.env.MONGO_URI

    if(!uri){  //Unique Resource Identifier
        throw new Error("Database Mongo config missing from .env")
    }

    try {
        await mongoose.connect(uri)
        console.log("MongoDB connected");
        
    } catch (error) {
        console.log(`Connection failed: ${error}`)
        process.exit(1)
    }
}
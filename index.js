import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import { serve } from "inngest/express";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/userRoutes.js";
import { functions, inngest } from "./configs/inngest.js";

const app = express();

await connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
        allowHeaders: ["Content-Type", "Authorization"],
    })
);

app.get("/", (req, res) => res.send("Hello from server"));

app.use("/api/users", userRouter);

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use(clerkMiddleware());

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

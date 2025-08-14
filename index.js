import "dotenv/config";
import cors from "cors";
import express from "express";
import { serve } from "inngest/express";
import connectDB from "./configs/db.js";
import cookieParser from "cookie-parser";
import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import storyRouter from "./routes/storyRoutes.js";
import { functions, inngest } from "./configs/inngest.js";
import messageRouter from "./routes/const messageRoutes.js";

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
app.use("/api/posts", postRouter);
app.use("/api/stories", storyRouter);
app.use("/api/messages", messageRouter);

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use(clerkMiddleware());

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

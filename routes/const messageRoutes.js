import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";
import {
    getChatMessages,
    sendMessage,
    sseController,
} from "../controllers/messageController.js";

const messageRouter = Router();

messageRouter.get("/:userId", sseController);
messageRouter.get("get", protect, getChatMessages);
messageRouter.post("/send", upload.single("image"), protect, sendMessage);

export default messageRouter;

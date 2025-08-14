import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";
import {
    addPost,
    getFeedPosts,
    likePost,
} from "../controllers/postController.js";

const postRouter = Router();

postRouter.put("/like", protect, likePost);
postRouter.get("/feed", protect, getFeedPosts);
postRouter.post("/add", upload.array("images", 4), protect, addPost);

export default postRouter;

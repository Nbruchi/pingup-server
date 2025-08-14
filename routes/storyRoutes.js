import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import { upload } from "../configs/multer.js";
import { addUserStory, getStories } from "../controllers/storyController.js";

const storyRouter = Router();

storyRouter.get("/get", protect, getStories);
storyRouter.post("/add", upload.single("media"), protect, addUserStory);

export default storyRouter;

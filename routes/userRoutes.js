import { Router } from "express";
import { protect } from "../middlewares/auth.js";
import {
    discoverUsers,
    followUser,
    updateUserData,
    getUserData,
    unfollowUser,
} from "../controllers/userController.js";
import { upload } from "../configs/multer.js";

const userRouter = Router();

userRouter.get("/data", protect, getUserData);
userRouter.put(
    "/update",
    upload.fields([
        { name: "profile", maxCount: 1 },
        { name: "cover", maxCount: 1 },
    ]),
    protect,
    updateUserData
);
userRouter.get("/discover", protect, discoverUsers);
userRouter.put("/follow", protect, followUser);
userRouter.put("/unfollow", protect, unfollowUser);

export default userRouter;

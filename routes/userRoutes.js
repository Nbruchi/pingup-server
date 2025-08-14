import { Router } from "express";
import {
    discoverUsers,
    followUser,
    updateUserData,
    getUserData,
    unfollowUser,
    sendConnectionRequest,
    acceptConnectionRequest,
    getUserConnections,
    getUserProfiles,
} from "../controllers/userController.js";
import { upload } from "../configs/multer.js";
import { protect } from "../middlewares/auth.js";
import { getUserRecentMessages } from "../controllers/messageController.js";

const userRouter = Router();

userRouter.put(
    "/update",
    upload.fields([
        { name: "profile", maxCount: 1 },
        { name: "cover", maxCount: 1 },
    ]),
    protect,
    updateUserData
);
userRouter.get("/data", protect, getUserData);
userRouter.put("/follow", protect, followUser);
userRouter.get("/profile", getUserProfiles);
userRouter.put("/unfollow", protect, unfollowUser);
userRouter.get("/discover", protect, discoverUsers);
userRouter.post("/connect", protect, sendConnectionRequest);
userRouter.post("/accept", protect, acceptConnectionRequest);
userRouter.get("/connections", protect, getUserConnections);
userRouter.get("/recent-messages", protect, getUserRecentMessages);

export default userRouter;

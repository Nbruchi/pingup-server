import fs from "fs";
import User from "../models/User.js";
import Story from "../models/Story.js";
import imageKit from "../configs/imageKit.js";
import { inngest } from "../configs/inngest.js";

export const addUserStory = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { content, media_type, background_color } = req.body;
        const media = req.file;

        let media_url = "";

        if (media_type === "image" || media_type === "video") {
            const fileBuffer = fs.readFileSync(media.path);
            const response = await imageKit.upload({
                file: fileBuffer,
                fileName: media.originalname,
            });
            media_url = response.url;
        }

        // Schedule story deletion after 24 hours
        await inngest.send({
            name: "app/story-delete",
            data: { storyId: story._id },
        });

        const story = await Story.create({
            user: userId,
            content,
            media_url,
            media_type,
            background_color,
        });

        return res.json({ success: true, story });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

export const getStories = async (req, res) => {
    try {
        const { userId } = req.auth();

        const user = await User.findById(userId);

        // User connections and following
        const userIds = [userId, ...user.connections, ...user.following];

        const stories = await Story.find({ user: { $in: userIds } })
            .populate("user")
            .sort({ createdAt: -1 });

        return res.json({ success: true, stories });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

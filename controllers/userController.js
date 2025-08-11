import User from "../models/User.js";
import fs from "fs";
import imageKit from "../configs/imageKit.js";

export const getUserData = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId);

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        return res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

export const updateUserData = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { username, bio, location, full_name } = req.body;

        const tempUser = await User.findById(userId);

        !username && (username = tempUser.username);

        if (tempUser.username !== username) {
            const user = User.findOne({ username });

            if (user) {
                username = tempUser.username;
            }
        }

        const udpatedData = {
            username,
            bio,
            loation,
            full_name,
        };

        const profile = req.files.profile && req.files.profile[0];
        const cover = req.files.cover && req.files.cover[0];

        if (profile) {
            const buffer = fs.readFileSync(profile.path);
            const response = await imageKit.upload({
                file: buffer,
                fileName: profile.originalname,
            });

            const url = imageKit.url({
                path: response.path,
                transformation: [
                    { width: "512", format: "png", quality: "auto" },
                ],
            });

            updateUserData.profile_picture = url;
            fs.unlinkSync(profile.path);
        }

        if (cover) {
            const buffer = fs.readFileSync(cover.path);
            const response = await imageKit.upload({
                file: buffer,
                fileName: cover.originalname,
            });

            const url = imageKit.url({
                path: response.path,
                transformation: [
                    { width: "1280", format: "png", quality: "auto" },
                ],
            });

            updateUserData.cover_photo = url;
            fs.unlinkSync(cover.path);
        }

        const user = await User.findByIdAndUpdate(userId, udpatedData, {
            new: true,
        });

        return res.json({
            success: true,
            message: "User updated successfully",
            user,
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

export const discoverUsers = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { input } = req.body;

        const allUsers = await User.find({
            $or: [
                { username: new RegExp(input, "i") },
                { email: new RegExp(input, "i") },
                { bio: new RegExp(input, "i") },
                { location: new RegExp(input, "i") },
                { full_name: new RegExp(input, "i") },
            ],
        });

        const filteredUsers = allUsers.filter((user) => user._id !== userId);

        return res.json({
            success: true,
            users: filteredUsers,
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

export const followUser = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        const user = await User.findById(userId);

        if (user.following.includes(id)) {
            return res.json({
                success: false,
                message: "You're already following this user",
            });
        }

        user.following.push(id);
        await user.save();

        const toUSer = await User.findById(id);
        toUSer.followers.push(userId);
        await toUSer.save();

        return res.json({
            success: true,
            message: "User followed successfully",
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

// Unfollow user
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        const user = await User.findById(userId);

        if (!user.following.includes(id)) {
            return res.json({
                success: false,
                message: "You're not following this user",
            });
        }

        user.following = user.following.filter((uid) => uid !== id);
        await user.save();

        const toUSer = await User.findById(id);
        toUSer.followers = toUSer.followers.filter((uid) => uid !== userId);
        await toUSer.save();

        return res.json({
            success: true,
            message: "User unfollowed successfully",
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};
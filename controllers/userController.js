import User from "../models/User.js";
import fs from "fs";
import imageKit from "../configs/imageKit.js";
import Connection from "../models/Connection.js";
import Post from "../models/Post.js";
import { inngest } from "../configs/inngest.js";

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
        let { username, bio, location, full_name } = req.body;

        const tempUser = await User.findById(userId);

        !username && (username = tempUser.username);

        if (tempUser.username !== username) {
            const user = await User.findOne({ username });

            if (user) {
                username = tempUser.username;
            }
        }

        const udpatedData = {
            username,
            bio,
            location,
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

export const sendConnectionRequest = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        // Check if user has sent more than 20 connection requests in the last 24 hours
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const connectionRequests = await Connection.find({
            from_user_id: userId,
            createdAt: { $gt: last24Hours },
        });

        if (connectionRequests >= 20) {
            return res.json({
                success: false,
                message:
                    "You've sent more than 20 connection requests in the last 24 hours",
            });
        }

        // Check if users are already connected
        const connection = await Connection.findOne({
            $or: [
                { from_user_id: userId, to_user_id: id },
                { from_user_id: id, to_user_id: userId },
            ],
        });

        if (!connection) {
            const newConnection = await Connection.create({
                from_user_id: userId,
                to_user_id: id,
            });

            await inngest.send({
                name: "app/connection-request",
                data: { connectionId: newConnection._id },
            });
            return res.json({
                success: true,
                message: "Connection request sent successfully!",
            });
        } else if (connection && connection.status === "accepted") {
            return res.json({
                success: false,
                message: "You're already connected with this user",
            });
        }
        return res.json({
            success: false,
            message: "Connection request pending",
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

// Get user connections
export const getUserConnections = async (req, res) => {
    try {
        const { userId } = req.auth();

        const user = await User.findById(userId).populate(
            "connections followers following"
        );

        const connections = user.connections;
        const followers = user.followers;
        const following = user.following;

        const pendingConnections = (
            await Connection.find({
                to_user_id: userId,
                status: "pending",
            }).populate("from_user_id")
        ).map((connection) => connection.from_user_id);

        return res.json({
            success: true,
            connections,
            followers,
            following,
            pendingConnections,
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

export const acceptConnectionRequest = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.body;

        const connection = await Connection.findOne({
            from_user_id: id,
            to_user_id: userId,
        });

        if (!connection) {
            return res.json({
                success: false,
                message: "Connection not found",
            });
        }

        const user = await User.findById({ userId });
        user.connections.push(id);
        await user.save();

        const toUser = await User.findById({ id });
        toUser.connections.push(userId);
        await toUser.save();

        connection.status = "accepted";
        await connection.save();

        return res.json({
            success: true,
            message: "Connection accepted successfully",
        });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

export const getUserProfiles = async (req, res) => {
    try {
        const { profileId } = req.body;

        const profile = await User.findById(profileId);

        if (!profile) {
            return res.json({ success: false, message: "Profile not found" });
        }

        const posts = await Post.find({ user: profileId }).populate("user");

        return res.json({ success: true, profile, posts });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

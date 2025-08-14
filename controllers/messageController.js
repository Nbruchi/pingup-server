import fs from "fs";
import Message from "../models/Message.js";
import imageKit from "../configs/imageKit.js";

// Empty object to store server-side event connections
const connections = {};

// Controller function for the SSE endpoint
export const sseController = async (req, res) => {
    const { userId } = req.params;
    console.log(`New client connected: ${userId}`);

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Add client's response object to the connections object
    connections[userId] = res;

    // Send an initial event to the client
    res.write("log: Connected to SSE stream\n/\n");

    // Handle client disconnection
    req.on("close", () => {
        // Remove the client's response object from the connections array
        delete connections[userId];
        console.log("Client disconnected");
    });
};

export const sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id, text } = req.body;
        const image = req.file;

        let media_url = "";
        let message_type = image ? "image" : "text";

        if (message_type === "image") {
            const fileBuffer = fs.readFileSync(media.path);
            const response = await imageKit.upload({
                file: fileBuffer,
                fileName: media.originalname,
            });
            media_url = imageKit.url({
                path: response.path,
                transformation: [
                    { width: "1280", format: "png", quality: "auto" },
                ],
            });
        }

        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url,
        });

        // Send message to to_user_id using SSE
        const messageWithUserData = await Message.findById(
            message._id
        ).populate("from_user_id");

        if (connections[userId]) {
            connections[userId].write(
                `data: ${JSON.stringify(messageWithUserData)}\n\n`
            );
        }

        return res.json({ success: true, message });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { to_user_id } = req.body;

        const messages = await Message.find({
            $or: [
                { from_user_id: userId, to_user_id },
                { from_user_id: to_user_id, to_user_id: userId },
            ],
        }).sort({ createdAt: -1 });

        // Mark messages as seen
        await Message.updateMany(
            { from_user_id: to_user_id, to_user_id: userId },
            { seen: true }
        );

        return res.json({ success: true, messages });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

export const getUserRecentMessages = async (req, res) => {
    try {
        const { userId } = req.auth();
        const messages = await Message.find({ to_user_id: userId })
            .populate("from_user_id to_user_id")
            .sort({ createdAt: -1 });

        return res.json({ success: true, messages });
    } catch (error) {
        console.log(error);
        return res.json({ success: false, message: error.message });
    }
};

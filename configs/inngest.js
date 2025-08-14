import { Inngest } from "inngest";
import sendEmail from "./nodeMailer.js";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";

export const inngest = new Inngest({ id: "pingup" });

// Inngest function to save user data to database
const syncUserCreation = inngest.createFunction(
    { id: "sync-user-from-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } =
            event.data;
        let username = email_addresses[0].email_address.split("@")[0];

        // Check if username already exists
        const user = await User.findOne({ username });

        if (user) {
            username += Math.floor(Math.random() * 1000); // Append random number to username
        }

        const userData = {
            _id: id,
            email: email_addresses[0].email_address,
            full_name: `${first_name} ${last_name}`,
            profile_picture: image_url,
            username,
        };

        await User.create(userData);
    }
);

// Inngest function to update user data in database
const syncUserUpdate = inngest.createFunction(
    { id: "sync-user-update-from-clerk" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } =
            event.data;
        const userData = {
            full_name: `${first_name} ${last_name}`,
            profile_picture: image_url,
            email: email_addresses[0].email_address,
        };

        await User.findByIdAndUpdate(id, userData, { new: true });
    }
);

// Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
    { id: "sync-user-deletion-from-clerk" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        const { id } = event.data;

        // Delete user from database
        await User.findByIdAndDelete(id);
    }
);

// Inngest function to send reminder when connection is added
const sendNewConnectionRequestReminder = inngest.createFunction(
    { id: "send-new-connection-request-reminder" },
    { event: "app/connection-request" },
    async ({ event, step }) => {
        const { connectionId } = event.data;

        await step.run("send-connection-request-email", async () => {
            const connection = await Connection.findById(connectionId).populate(
                "from_user_id to_user_id"
            );

            const subject = "👋 New Connection Request";
            const body = `
            <div style="font-family:Arial,sans-serif,padding:20px">
                <h2>Hi ${connection.to_user_id.full_name},</h2>
                <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
                <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color:#10b981">here</a> to accept or reject the request</p>
                <br/>
                <p>Thanks, <br/> Pingup - Stay Connected.</p>
            </div>`;

            await sendEmail({
                to: connection.to_user_id.email,
                subject,
                body,
            });
        });

        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await step.sleepUntil("wait-for-24-hours", in24Hours);
        await step.run("send-connection-request-reminder", async () => {
            const connection = await Connection.findById(connectionId).populate(
                "from_user_id to_user_id"
            );

            if (connection.status === "accepted") {
                return { message: "Already accepted" };
            }

            const subject = "👋 New Connection Request";
            const body = `
            <div style="font-family:Arial,sans-serif,padding:20px">
                <h2>Hi ${connection.to_user_id.full_name},</h2>
                <p>You have a new connection request from ${connection.from_user_id.full_name} - @${connection.from_user_id.username}</p>
                <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color:#10b981">here</a> to accept or reject the request</p>
                <br/>
                <p>Thanks, <br/> Pingup - Stay Connected.</p>
            </div>`;

            await sendEmail({
                to: connection.to_user_id.email,
                subject,
                body,
            });

            return { message: "Reminder sent!" };
        });
    }
);

// Inngest function to delete post after 24 hours
const deleteStory = inngest.createFunction(
    { id: "story-delete" },
    { event: "app/story-delete" },
    async ({ event, step }) => {
        const { storyId } = event.data;
        const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await step.sleepUntil("wait-for-24-hours", in24Hours);

        await step.run("delete-story", async () => {
            await Story.findByIdAndDelete(storyId);
            return { message: "Story deleted!" };
        });
    }
);

// Inngest function to send unseen messages notifications
const sendUnseenMessagesNotification = inngest.createFunction(
    { id: "send-unseen-messages-notification" },
    { cron: "TZ=America/New York 0 9 * * *" }, // Everyday 9 AM
    async () => {
        const messages = await Message.find({ seen: false }).populate(
            "to_user_id"
        );
        const unseenCount = {};

        messages.map((message) => {
            unseenCount[message.to_user_id._id] =
                (unseenCount[message.to_user_id._id] || 0) + 1;
        });

        for (const userId in unseenCount) {
            const user = await User.findById(userId);

            const subject = `🔔 You have ${unseenCount[userId]} unseen messages`;
            const body = `
            <div style="font-family:Arial,sans-serif,padding:20px">
                <h2>Hi ${user.full_name},</h2>
                <p>You have ${unseenCount[userIdd]} unseen messages</p>
                <p>Click <a href="${process.env.FRONTEND_URL}/messages" style="color:#10b981">here</a> to view them</p>
                <br/>
                <p>Thanks, <br/> Pingup - Stay Connected.</p>
            </div>`;

            await sendEmail({
                to: user.email,
                subject,
                body,
            });
        }
        return { message: "Notification sent!" };
    }
);

export const functions = [
    deleteStory,
    syncUserUpdate,
    syncUserCreation,
    syncUserDeletion,
    sendUnseenMessagesNotification,
    sendNewConnectionRequestReminder,
];

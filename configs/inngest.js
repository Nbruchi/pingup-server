import { Inngest } from "inngest";
import User from "../models/User.js";

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
export const functions = [syncUserCreation, syncUserUpdate, syncUserDeletion];

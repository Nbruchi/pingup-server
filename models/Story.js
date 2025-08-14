import { Schema, model } from "mongoose";

const storySchema = new Schema(
    {
        user: { type: String, ref: "User", required: true },
        content: { type: String },
        media_url: { type: String },
        media_type: { type: String, enum: ["video", "text", "image"] },
        views_count: [{ type: String, ref: "User" }],
        background_color: { type: String },
    },
    { timestamps: true, minimize: false }
);

const Story = model("Story", storySchema);

export default Story;

// convex/audioFiles.js
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// All audio files belonging to a user, newest first
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("audioFiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Single file by its _id
export const getById = query({
  args: { audioFileId: v.id("audioFiles") },
  handler: async (ctx, { audioFileId }) => {
    return await ctx.db.get(audioFileId);
  },
});

// Insert a new audio file record after upload
export const create = mutation({
  args: {
    userId:    v.id("users"),
    storageId: v.string(),
    filename:  v.string(),
    mimeType:  v.string(),
    sizeBytes: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("audioFiles", {
      ...args,
      uploadedAt: Date.now(),
    });
  },
});

// Delete a file record (ownership enforced)
export const remove = mutation({
  args: {
    audioFileId: v.id("audioFiles"),
    userId:      v.id("users"),
  },
  handler: async (ctx, { audioFileId, userId }) => {
    const file = await ctx.db.get(audioFileId);
    if (!file)                  throw new Error("NOT_FOUND");
    if (file.userId !== userId) throw new Error("FORBIDDEN");
    await ctx.db.delete(audioFileId);
  },
});

// Generate a one-time upload URL for Convex File Storage
export const generateUploadUrl = mutation({
  handler: async (ctx) => ctx.storage.generateUploadUrl(),
});

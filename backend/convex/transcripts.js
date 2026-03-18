import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// All transcripts for a user, newest first
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("transcripts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// The transcript linked to a specific audio file
export const getByAudioFile = query({
  args: { audioFileId: v.id("audioFiles") },
  handler: async (ctx, { audioFileId }) => {
    return await ctx.db
      .query("transcripts")
      .withIndex("by_audio_file", (q) => q.eq("audioFileId", audioFileId))
      .unique();
  },
});

// Insert a new transcript after DeepSpeech returns
export const create = mutation({
  args: {
    userId:      v.id("users"),
    audioFileId: v.id("audioFiles"),
    text:        v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transcripts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

// Delete a transcript (ownership enforced)
export const remove = mutation({
  args: {
    transcriptId: v.id("transcripts"),
    userId:       v.id("users"),
  },
  handler: async (ctx, { transcriptId, userId }) => {
    const t = await ctx.db.get(transcriptId);
    if (!t)                  throw new Error("NOT_FOUND");
    if (t.userId !== userId) throw new Error("FORBIDDEN");
    await ctx.db.delete(transcriptId);
  },
});

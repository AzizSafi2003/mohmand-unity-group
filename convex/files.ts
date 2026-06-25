import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireApproved } from "./lib/auth";

/**
 * FILES — Convex file storage helpers for uploads (profile photos, banners…).
 * Flow: client calls generateUploadUrl -> POSTs the file -> stores returned
 * storageId on the relevant record. getUrl resolves a storageId to a served URL.
 */

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireApproved(ctx); // any approved user may upload (e.g. own photo)
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId);
  },
});

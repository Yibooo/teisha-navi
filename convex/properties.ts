import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    ward: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.ward) {
      return ctx.db.query("properties").withIndex("by_ward", (q) => q.eq("ward", args.ward!)).collect();
    }
    return ctx.db.query("properties").collect();
  },
});

export const get = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("properties")),
    name: v.string(),
    ward: v.string(),
    address: v.string(),
    leaseStartYear: v.number(),
    leaseTotalYears: v.number(),
    buildingYear: v.number(),
    totalUnits: v.optional(v.number()),
    nearestStation: v.optional(v.string()),
    walkMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    if (id) {
      await ctx.db.patch(id, data);
      return id;
    }
    return ctx.db.insert("properties", data);
  },
});

export const remove = mutation({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getWards = query({
  args: {},
  handler: async (ctx) => {
    const props = await ctx.db.query("properties").collect();
    const wards = [...new Set(props.map((p) => p.ward))].sort();
    return wards;
  },
});

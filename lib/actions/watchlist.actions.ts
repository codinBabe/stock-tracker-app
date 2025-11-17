"use server";

import { connectDB } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";

export const getWatchlistSymbolsByEmail = async (
  email: string
): Promise<string[]> => {
  try {
    const mongoose = await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not found");
    }

    const user = await db
      .collection("user")
      .findOne<{ id: string; _id: unknown; email: string }>({ email });
    if (!user) return [];

    const userid = (user.id as string) || String(user._id?.toString() || "");
    if (!userid) return [];

    const items = await Watchlist.find({ userid }, { symbol: 1 }).lean();

    return items.map((i) => String(i.symbol));
  } catch (e) {
    console.error("Failed to get watchlist symbols by email", e);
    return [];
  }
};

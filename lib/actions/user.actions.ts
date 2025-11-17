"use server";

import { connectDB } from "@/database/mongoose";

export const getAllUsersForNewsEmail = async () => {
  try {
    const mongoose = await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not found");
    }

    const users = await db
      .collection("user")
      .find(
        { email: { $ne: null, $exists: true } },
        { projection: { _id: 1, id: 1, email: 1, name: 1, country: 1 } }
      )
      .toArray();

    return users
      .filter((user) => user.email && user.name)
      .map((user) => ({
        id: user.id || user._id?.toString() || "",
        email: user.email,
        name: user.name,
      }));
  } catch (e) {
    console.error("Failed to get users for news email", e);
    return [];
  }
};

import mongoose from "mongoose";
import { logger } from "./logger";

import User from "../models/user.model";

export async function connectToDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.error("DATABASE_URL environment variable is missing");
    process.exit(1);
  }

  try {
    await mongoose.connect(databaseUrl);
    logger.info("Successfully connected to MongoDB.");
    
    // Seed default admin if no users exist
    await seedAdmin();
  } catch (error) {
    logger.error({ error }, "Error connecting to MongoDB");
    process.exit(1);
  }
}

async function seedAdmin() {
  const adminEmail = "admin@admin.com";
  const adminExists = await User.findOne({ email: adminEmail });
  
  if (!adminExists) {
    await User.create({
      name: "System Admin",
      email: adminEmail,
      password: "admin", // User should change this after first login
      role: "admin",
      status: "approved"
    });
    logger.info("Default admin user created (admin@admin.com / admin)");
  }
}

// Handle connection events
mongoose.connection.on("error", (err) => {
  logger.error({ err }, "MongoDB connection error");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

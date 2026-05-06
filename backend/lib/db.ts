import mongoose from "mongoose";
import { logger } from "./logger";

export async function connectToDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    logger.error("DATABASE_URL environment variable is missing");
    process.exit(1);
  }

  try {
    await mongoose.connect(databaseUrl);
    logger.info("Successfully connected to MongoDB.");
  } catch (error) {
    logger.error({ error }, "Error connecting to MongoDB");
    process.exit(1);
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

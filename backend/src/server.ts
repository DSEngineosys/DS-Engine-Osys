import "./load-env";
import app from "./app";
import { logger } from "./lib/logger";
import { connectToDatabase } from "./lib/db";
import Bonus from "./models/bonus.model";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Connect to MongoDB
await connectToDatabase();

// Background cleanup: remove expired bonus offers every 30 seconds
setInterval(async () => {
  try {
    const now = new Date();
    const result = await Bonus.deleteMany({
      expiry: { $exists: true, $ne: null, $lte: now },
    });
    if (result.deletedCount > 0) {
      logger.info({ deletedCount: result.deletedCount }, "Expired bonus offers cleaned up");
    }
  } catch (err) {
    logger.error({ err }, "Bonus cleanup job failed");
  }
}, 30_000);

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

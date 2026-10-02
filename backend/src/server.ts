import "./load-env";
import app from "./app";
import { logger } from "./lib/logger";
import { connectToDatabase } from "./lib/db";
import Bonus from "./models/bonus.model";
import { startDailyCollector } from "./jobs/daily-collector";
import { checkAndCleanExpiredProductOffers } from "./services/product-offer-cleaner";
import { spawn, type ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const rawPort = process.env["PORT"] ?? "8080";

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

// Start daily data collection job
startDailyCollector();

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

// Background cleanup: check expired product offers, archive to productperformances collection & remove offer from product
setInterval(async () => {
  await checkAndCleanExpiredProductOffers();
}, 10_000);

// ─── ML Service Auto-Start ───────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ML_SERVICE_DIR = path.resolve(__dirname, "../../ml-service");
const PYTHON_BIN = path.join(ML_SERVICE_DIR, "venv", "Scripts", "python.exe");

let mlProcess: ChildProcess | null = null;

function startMlService() {
  logger.info("[ML] Starting ML service...");

  mlProcess = spawn(PYTHON_BIN, ["app.py"], {
    cwd: ML_SERVICE_DIR,
    stdio: ["ignore", "pipe", "pipe"],
  });

  mlProcess.stdout?.on("data", (chunk: Buffer) => {
    chunk.toString().split("\n").filter(Boolean).forEach((line: string) => {
      logger.info(`[ML] ${line.trim()}`);
    });
  });

  mlProcess.stderr?.on("data", (chunk: Buffer) => {
    chunk.toString().split("\n").filter(Boolean).forEach((line: string) => {
      // Flask logs info/warnings to stderr — only treat as error if truly an error
      if (line.toLowerCase().includes("error") || line.toLowerCase().includes("traceback")) {
        logger.error(`[ML] ${line.trim()}`);
      } else {
        logger.info(`[ML] ${line.trim()}`);
      }
    });
  });

  mlProcess.on("exit", (code, signal) => {
    if (signal !== "SIGTERM" && signal !== "SIGKILL") {
      logger.warn({ code, signal }, "[ML] ML service exited unexpectedly — restarting in 5s...");
      setTimeout(startMlService, 5000);
    } else {
      logger.info("[ML] ML service stopped.");
    }
  });

  mlProcess.on("error", (err) => {
    logger.error({ err }, "[ML] Failed to start ML service process");
  });
}

function stopMlService() {
  if (mlProcess && !mlProcess.killed) {
    logger.info("[ML] Stopping ML service...");
    mlProcess.kill("SIGTERM");
    mlProcess = null;
  }
}

// Kill ML service when the backend process exits
process.on("exit", stopMlService);
process.on("SIGINT", () => { stopMlService(); process.exit(0); });
process.on("SIGTERM", () => { stopMlService(); process.exit(0); });

// Start ML service alongside backend
startMlService();

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

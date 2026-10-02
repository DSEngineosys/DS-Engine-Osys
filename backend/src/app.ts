import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const sessionSecret = process.env.SESSION_SECRET ?? "ds-engineosys-secret-key-2024";

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/api/images", express.static(path.join(__dirname, "data", "ProductImages")));

app.use("/api", router);

// ─── Global Error Handler ───────────────────────────────────────────────────
// Catches all unhandled errors thrown by async route handlers.
// Without this, Express 5 re-throws async errors causing unhandled rejections.
app.use((err: any, req: any, res: any, next: any) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  logger.error({ err, path: req.path, method: req.method }, "Unhandled route error");
  if (!res.headersSent) {
    res.status(status).json({ error: "Server Error", message });
  }
});

export default app;

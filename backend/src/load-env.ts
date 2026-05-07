import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load from current directory .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Load from parent directory .env (if running from backend/)
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

// Also try loading from the directory where this file resides
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

// config.ts
import * as dotenv from "dotenv";
dotenv.config();

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const OPENAI_ORG_ID = process.env.OPENAI_ORG_ID || "";

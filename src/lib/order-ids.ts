import { randomBytes } from "crypto";

export function generateClientTransactionId(): string {
  return `FR${randomBytes(8).toString("hex").toUpperCase()}`;
}


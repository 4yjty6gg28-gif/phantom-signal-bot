import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2/promise";
import { env } from "../lib/env.js";
import * as schema from "../../db/schema.js";
import * as relations from "../../db/relations.js";

let connection: ReturnType<typeof createConnection> | undefined;

export async function getDb() {
  if (!connection) {
    connection = createConnection(env.DATABASE_URL);
  }
  return drizzle(await connection, { schema: { ...schema, ...relations }, mode: "default" });
}

export type Db = Awaited<ReturnType<typeof getDb>>;

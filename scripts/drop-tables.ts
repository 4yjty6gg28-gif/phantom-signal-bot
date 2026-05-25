import { createConnection } from 'mysql2/promise';
import { config } from 'dotenv';
config();

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URL || 'mysql://4DrrNHiLxX7KSUj.root:gnqxfN5XZx8RVD2Rf7CbgqMxu9AdCehz@ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com:4000/19e601b9-0712-86f9-8000-0987ea793dc7');
  const conn = await createConnection({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port) || 3306,
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: false },
  });
  await conn.execute('DROP TABLE IF EXISTS ai_votes');
  await conn.execute('DROP TABLE IF EXISTS subscriptions');
  await conn.execute('DROP TABLE IF EXISTS signals');
  console.log('Tables dropped successfully');
  await conn.end();
}

main().catch(console.error);

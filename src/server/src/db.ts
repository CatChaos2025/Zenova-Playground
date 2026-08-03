import { PrismaClient } from './generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_URL || 'file:./data/database.sqlite');
const adapter = new PrismaBetterSqlite3(db);
const prisma = new PrismaClient({ adapter });

export default prisma;
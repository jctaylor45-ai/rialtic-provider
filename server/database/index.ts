/**
 * Database Client
 *
 * SQLite database connection using better-sqlite3 and Drizzle ORM.
 * The database file is stored in the project root as `provider-portal.db`.
 */

import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { join } from 'path'

// Database file path - stored in project root
const DB_PATH = join(process.cwd(), 'provider-portal.db')

// Create SQLite connection
const sqlite = new Database(DB_PATH)

// Enable foreign keys
sqlite.pragma('foreign_keys = ON')

// Create Drizzle instance with schema for relational queries
export const db = drizzle(sqlite, { schema })

// Export schema for use in queries
export * from './schema'

// Export types for use in application
export type DbClient = typeof db

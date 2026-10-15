import { testDatabaseUrl } from './database-url';

process.env.DATABASE_URL = testDatabaseUrl();
process.env.APP_TIMEZONE = 'Europe/Moscow';

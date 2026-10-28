// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_init.sql';
import m0001 from './0001_pull_view_fields.sql';
import m0002 from './0002_workout_local.sql';
import m0003 from './0003_day_local.sql';
import m0004 from './0004_limitation_local.sql';
import m0005 from './0005_program_local.sql';
import m0006 from './0006_profile_created.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004,
m0005,
m0006
    }
  }
  
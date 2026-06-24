const { knexConfig } = require('./src/config/database');
module.exports = {
  development: {
    ...knexConfig,
    migrations: { directory: './src/db/migrations' },
    seeds: { directory: './src/db/seeds' }
  },
  production: {
    ...knexConfig,
    migrations: { directory: './src/db/migrations' },
    seeds: { directory: './src/db/seeds' }
  }
};
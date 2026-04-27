const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const { Client } = require('pg');

const client = new Client({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB
});

// 🔥 DEBUG (temporal)
console.log("PG_PASSWORD:", process.env.PG_PASSWORD);

client.connect()
  .then(() => console.log('✅ PostgreSQL conectado'))
  .catch(err => console.error('❌ Error PostgreSQL:', err));

module.exports = client;
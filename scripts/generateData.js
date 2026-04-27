require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env.docker')
});

const mysql = require('../config/mysql');
const pgClient = require('../config/postgres');
require('../config/mongo');

const Ahorro = require('../config/ahorroModel');
const { faker } = require('@faker-js/faker');

async function generarDatos() {
  console.log("🚀 Generando datos...");

  const total = 1000;
  const batchSize = 50;

  for (let i = 0; i < total; i += batchSize) {
    const usuariosBatch = [];
    const pgBatch = [];
    const mongoBatch = [];

    for (let j = 0; j < batchSize; j++) {
      // ✅ faker v7 (corregido)
      const userId = faker.datatype.uuid();

      const nombre = faker.name.fullName();
      const correo = faker.internet.email();
      const telefono = faker.phone.phoneNumber();

      const totalCuenta = faker.datatype.number({ min: 10000, max: 5000000 });
      const deuda = faker.datatype.number({ min: 0, max: totalCuenta });
      const ahorro = faker.datatype.number({ min: 0, max: totalCuenta - deuda });

      // MySQL
      usuariosBatch.push([userId, nombre, correo, telefono]);

      // PostgreSQL
      pgBatch.push({
        id: userId,
        nombre,
        totalCuenta,
        deuda
      });

      // Mongo
      mongoBatch.push({
        userId,
        ahorro
      });
    }

    try {
      // 🔥 MySQL batch
      await mysql.query(
        'INSERT INTO usuarios (id, nombre, correo, telefono) VALUES ?',
        [usuariosBatch]
      );

      // 🔥 PostgreSQL batch
      for (const item of pgBatch) {
        await pgClient.query(
          'INSERT INTO finanzas (id, nombre, total_cuenta, deuda) VALUES ($1, $2, $3, $4)',
          [item.id, item.nombre, item.totalCuenta, item.deuda]
        );
      }

      // 🔥 Mongo batch
      await Ahorro.insertMany(mongoBatch);

      console.log(`✔ Insertados ${i + batchSize}`);

    } catch (error) {
      console.error("❌ Error batch:", error);
    }
  }

  console.log("🎉 1000 datos generados correctamente");

  await mysql.end();
  await pgClient.end();
  process.exit();
}

generarDatos();
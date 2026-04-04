require('dotenv').config();

const mysql = require('../config/mysql');
const pgClient = require('../config/postgres');
require('../config/mongo');

const Ahorro = require('../config/ahorroModel');
const { faker } = require('@faker-js/faker');

async function generarDatos() {
  console.log("🚀 Generando datos...");

  for (let i = 0; i < 1000; i++) {
    const userId = faker.string.uuid();

    const nombre = faker.person.fullName();
    const correo = faker.internet.email();
    const telefono = faker.phone.number();

    const totalCuenta = faker.number.int({ min: 10000, max: 5000000 });
    const deuda = faker.number.int({ min: 0, max: totalCuenta });
    const ahorro = faker.number.int({ min: 0, max: totalCuenta - deuda });

    try {
      // MySQL
      await new Promise((resolve, reject) => {
        mysql.query(
          'INSERT INTO usuarios (id, nombre, correo, telefono) VALUES (?, ?, ?, ?)',
          [userId, nombre, correo, telefono],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // PostgreSQL
      await pgClient.query(
        'INSERT INTO finanzas (id, total_cuenta, deuda) VALUES ($1, $2, $3)',
        [userId, totalCuenta, deuda]
      );

      // MongoDB
      await Ahorro.create({
        userId,
        ahorro
      });

      console.log(`✔ Registro ${i + 1}`);
    } catch (error) {
      console.error("❌ Error:", error);
    }
  }

  console.log("🎉 Datos generados");
  process.exit();
}

generarDatos();
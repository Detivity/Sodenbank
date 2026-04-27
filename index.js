require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Conexiones
const mysql = require('./config/mysql'); // mysql2/promise (pool)
const pgClient = require('./config/postgres');
require('./config/mongo');
const Ahorro = require('./config/ahorroModel');

// 🟢 Ruta base
app.get('/', (req, res) => {
  res.send('Sodenbank funcionando 🚀');
});

// 🔥 Usuario completo (multi-DB)
app.get('/usuario/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // MySQL
    const [users] = await mysql.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [id]
    );

    if (!users[0]) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const user = users[0];

    // PostgreSQL
    const finanzas = await pgClient.query(
      'SELECT * FROM finanzas WHERE id = $1',
      [id]
    );

    // MongoDB
    const ahorro = await Ahorro.findOne({ userId: id });

    res.json({
      id,
      nombre: user.nombre,
      correo: user.correo,
      telefono: user.telefono,
      total: finanzas.rows[0]?.total_cuenta,
      deuda: finanzas.rows[0]?.deuda,
      ahorro: ahorro?.ahorro
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error obteniendo datos' });
  }
});

// 🔍 Buscar usuarios
app.get('/buscar/:nombre', async (req, res) => {
  const { nombre } = req.params;

  try {
    const [results] = await mysql.query(
      'SELECT * FROM usuarios WHERE nombre LIKE ? LIMIT 10',
      [`%${nombre}%`]
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📋 Listar usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const [results] = await mysql.query(
      'SELECT * FROM usuarios LIMIT 1000'
    );

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 💰 Finanzas mayores a X
app.get('/finanzas/mayor/:valor', async (req, res) => {
  const { valor } = req.params;

  try {
    const result = await pgClient.query(
      'SELECT * FROM finanzas WHERE total_cuenta > $1 LIMIT 20',
      [valor]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🏆 TOP usuarios con nombre (para Grafana)
app.get('/top-usuarios', async (req, res) => {
  try {
    const finanzas = await pgClient.query(`
      SELECT id, total_cuenta
      FROM finanzas
      ORDER BY total_cuenta DESC
      LIMIT 5
    `);

    const resultado = [];

    for (let user of finanzas.rows) {
      const [usuarios] = await mysql.query(
        'SELECT nombre FROM usuarios WHERE id = ?',
        [user.id]
      );

      resultado.push({
        nombre: usuarios[0]?.nombre || "Desconocido",
        total: user.total_cuenta
      });
    }

    res.json(resultado);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en top usuarios' });
  }
});

// 🚀 Servidor (SIEMPRE AL FINAL)
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});
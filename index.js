require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// Conexiones
const mysql = require('./config/mysql');
const pgClient = require('./config/postgres');
require('./config/mongo');
const Ahorro = require('./config/ahorroModel');

// Ruta base
app.get('/', (req, res) => {
  res.send('Sodenbank funcionando 🚀');
});

// 🔥 Endpoint combinado
app.get('/usuario/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // MySQL
    const user = await new Promise((resolve, reject) => {
      mysql.query(
        'SELECT * FROM usuarios WHERE id = ?',
        [id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        }
      );
    });

    if (!user) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // PostgreSQL
    const finanzas = await pgClient.query(
      'SELECT * FROM finanzas WHERE id = $1',
      [id]
    );

    // MongoDB
    const ahorro = await Ahorro.findOne({ userId: id });

    res.json({
      id: id,
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
app.get('/buscar/:nombre', (req, res) => {
  const { nombre } = req.params;

  mysql.query(
    'SELECT * FROM usuarios WHERE nombre LIKE ? LIMIT 10',
    [`%${nombre}%`],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      res.json(results);
    }
  );
});
// 🔥 Listar usuarios
app.get('/usuarios', (req, res) => {
  mysql.query('SELECT * FROM usuarios LIMIT 1000', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json(results);
  });
});
app.get('/finanzas/mayor/:valor', async (req, res) => {
  const { valor } = req.params;

  const result = await pgClient.query(
    'SELECT * FROM finanzas WHERE total_cuenta > $1 LIMIT 20',
    [valor]
  );

  res.json(result.rows);
});
// Servidor
app.listen(process.env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${process.env.PORT}`);
});
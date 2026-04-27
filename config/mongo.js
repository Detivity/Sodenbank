const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../.env')
});

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

module.exports = mongoose;
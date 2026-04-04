const mongoose = require('mongoose');

const ahorroSchema = new mongoose.Schema({
  userId: String,
  ahorro: Number
});

module.exports = mongoose.model('Ahorro', ahorroSchema);
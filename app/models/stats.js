const mongoose = require('mongoose')

const statsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  hp: {
    type: Number,
    required: true
  },
  initiative: {
    type: Number,
    required: true
  },
  statusConditions: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Example', statsSchema)

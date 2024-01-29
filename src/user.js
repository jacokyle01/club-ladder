const mongoose = require('mongoose')
require('mongoose-long')(mongoose);
const {Types: {Long}} = mongoose;

const userSchema = new mongoose.Schema({
  id: {
    type: Long,
    required: true
  },
  standing: {
    type: Number,
    required: true
  },
  streak: {
    type: Number,
    required: true,
    default: 0
  },
  alias: {
    type: String,
    required: false,
    default: ""
  },
  challenging: {
    type: Array,
    required: true,
    default: []
  },
  challengedBy: {
    type: Array,
    required: true,
    default: []
  }, 
  wins: {
    type: Number,
    required: true,
    default: 0
  },                //results must be decisive
  losses: {
    type: Number,
    required: true,
    default: 0
  }
})

module.exports = mongoose.model('User', userSchema)
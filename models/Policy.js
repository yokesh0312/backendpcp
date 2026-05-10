const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  retentionDays: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);

const mongoose = require("mongoose");

const usageSchema = new mongoose.Schema({
  identifier: String,   // userId OR IP
  count: Number,
  startTime: Date
});

module.exports = mongoose.model("Usage", usageSchema);
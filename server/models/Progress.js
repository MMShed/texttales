const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  storyId: { type: mongoose.Schema.Types.ObjectId, required: true },
  nodeId: { type: String, required: true }
}, { timestamps: true });

progressSchema.index({ userId: 1, storyId: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);

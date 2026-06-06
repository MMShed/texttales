const mongoose = require("mongoose");


const choiceSchema = new mongoose.Schema({
  text: String,           // what appears on button
  playerText: String,     // what the user says (optional)
  nextNodeId: String      // where it leads
}, { _id: false });


const nodeSchema = new mongoose.Schema({
  nodeId: String,

  speaker: String,
  text: String,

  narrator_text: String,


  choices: {
    type: [choiceSchema],
    default: []
  },

  nextNodeId: String
}, { _id: false });


const storySchema = new mongoose.Schema({
  title: String,
  description: String,


  ready: {
    type: Boolean,
    default: false
  },


  view_count: {
    type: Number,
    default: 0
  },


  nodes: [nodeSchema],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Story", storySchema);
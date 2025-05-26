const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  calendarId: { type: mongoose.Schema.Types.ObjectId, ref: "Calendar", required: true },
  day: { type: Number, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  eventText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Event", EventSchema);
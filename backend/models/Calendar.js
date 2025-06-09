const mongoose = require("mongoose");

const CalendarSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#2563eb" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sharedWith: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      permissions: {
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        rename: { type: Boolean, default: false },
        addEvent: { type: Boolean, default: false },
        deleteEvent: { type: Boolean, default: false },
        editEvent: { type: Boolean, default: false },
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Calendar", CalendarSchema);
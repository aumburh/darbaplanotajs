const mongoose = require("mongoose");

const CalendarSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#2563eb" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sharedWith: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      permissions: {
        edit: { type: Boolean, default: true },
        delete: { type: Boolean, default: false },
        rename: { type: Boolean, default: false },
        addEvent: { type: Boolean, default: true },
        deleteEvent: { type: Boolean, default: true },
        editEvent: { type: Boolean, default: true },
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Calendar", CalendarSchema);

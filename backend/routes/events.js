const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const auth = require("../middleware/auth");

// Create a new event (protected)
router.post("/", auth, async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res.json(newEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get events for a calendar (protected)
router.get("/:calendarId", auth, async (req, res) => {
  try {
    const events = await Event.find({ calendarId: req.params.calendarId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an event by ID (protected)
router.delete("/:id", auth, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
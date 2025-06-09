const express = require("express");
const router = express.Router();
const Calendar = require("../models/Calendar");
const User = require("../models/User");
const auth = require("../middleware/auth");
const Event = require("../models/Event");

// Get all calendars for logged-in user (owned or shared)
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const calendars = await Calendar.find({
      $or: [{ owner: userId }, { "sharedWith.user": userId }],
    });

    const calendarsWithCounts = await Promise.all(
      calendars.map(async (calendar) => {
        try {
          const eventCount = await Event.countDocuments({ calendarId: calendar._id });
          return { ...calendar.toObject(), eventCount };
        } catch (err) {
          console.error(`Error counting events for calendar ${calendar._id}:`, err);
          return { ...calendar.toObject(), eventCount: 0 };
        }
      })
    );

    res.json(calendarsWithCounts);
  } catch (err) {
    console.error("Server error in /api/kalendars:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// Get a single calendar (with shared users populated)
router.get("/:id", auth, async (req, res) => {
  try {
      const calendar = await Calendar.findById(req.params.id)
       .populate("sharedWith.user", "email username")
        .populate("owner", "email username"); // <-- svarīgi
    if (!calendar)
      return res.status(404).json({ message: "Calendar not found" });
    res.json(calendar);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new calendar (owned by user)
router.post("/", auth, async (req, res) => {
  try {
    const newCalendar = new Calendar({
      ...req.body,
      owner: req.user.id,
    });
    await newCalendar.save();
    res.json(newCalendar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Share calendar with another user (by email or username)
router.post("/:id/share", auth, async (req, res) => {
  console.log("POST /:id/share route hit");
  try {
    const { identifier, permissions } = req.body;
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ error: "Kalendārs nav atrasts" });
    if (String(calendar.owner) !== req.user.id)
      return res.status(403).json({ error: "No permission" });

    // Find user by email OR username
    const userToShare = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!userToShare) return res.status(404).json({ error: "Lietotājs nav atrasts" });

    // Prevent duplicate sharing
    if (
      calendar.sharedWith.some(
        (sw) => String(sw.user) === String(userToShare._id)
      )
    ) {
      return res.status(400).json({ error: "Šis lietotājs jau ir pievienots kalendāram" });
    }

    calendar.sharedWith.push({
      user: userToShare._id,
      permissions: { ...(permissions || {}) }, // Default to empty permissions if not provided
    });
    await calendar.save();
    res.json({ message: "Calendar shared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update permissions for a shared user (by email or username)
router.put("/:id/share", auth, async (req, res) => {
  try {
    const { identifier, permissions } = req.body;
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ error: "Calendar not found" });
    if (String(calendar.owner) !== req.user.id)
      return res.status(403).json({ error: "No permission" });

    const userToEdit = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!userToEdit) return res.status(404).json({ error: "User not found" });

    const sharedUser = calendar.sharedWith.find(
      (sw) => String(sw.user) === String(userToEdit._id)
    );
    if (!sharedUser)
      return res
        .status(404)
        .json({ error: "User not shared with this calendar" });

    sharedUser.permissions = permissions;
    await calendar.save();
    res.json({ message: "Permissions updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove a shared user (by email or username)
router.delete("/:id/share", auth, async (req, res) => {
  try {
    const { identifier } = req.body;
    const calendar = await Calendar.findById(req.params.id).populate(
      "sharedWith.user"
    );
    if (!calendar) return res.status(404).json({ message: "Not found" });
    if (String(calendar.owner) !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    // Find user by email OR username
    const userToRemove = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!userToRemove) return res.status(404).json({ message: "User not found" });

    calendar.sharedWith = calendar.sharedWith.filter((sw) => {
      // sw.user may be populated (object) or just an ID
      const swId = sw.user._id ? sw.user._id.toString() : sw.user.toString();
      return swId !== userToRemove._id.toString();
    });
    await calendar.save();
    res.json(calendar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove calendar (only owner)
router.delete("/:id", auth, async (req, res) => {
  try {
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ message: "Not found" });
    if (String(calendar.owner) !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });
    await calendar.deleteOne();
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update calendar (rename, color, etc. - only owner)
router.put("/:id", auth, async (req, res) => {
  try {
    const { name, color } = req.body;
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ message: "Not found" });
    if (String(calendar.owner) !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });
    calendar.name = name;
    calendar.color = color;
    await calendar.save();
    res.json(calendar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
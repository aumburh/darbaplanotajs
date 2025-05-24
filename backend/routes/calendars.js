const express = require('express');
const router = express.Router();
const Calendar = require('../models/Calendar');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all calendars for logged-in user (owned or shared)
router.get('/', auth, async (req, res) => {
    const userId = req.user.id;
    const calendars = await Calendar.find({
        $or: [
            { owner: userId },
            { 'sharedWith.user': userId }
        ]
    });
    res.json(calendars);
});

router.get('/:id', require('../middleware/auth'), async (req, res) => {
    try {
        const calendar = await Calendar.findById(req.params.id);
        console.log('Fetching calendar with id:', req.params.id);
        if (!calendar) return res.status(404).json({ message: 'Calendar not found' });
        res.json(calendar);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new calendar (owned by user)
router.post('/', auth, async (req, res) => {
    try {
        const newCalendar = new Calendar({
            ...req.body,
            owner: req.user.id
        });
        await newCalendar.save();
        res.json(newCalendar);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Share calendar with another user (by email)
router.post('/:id/share', auth, async (req, res) => {
    const { email, permissions } = req.body;
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ error: 'Calendar not found' });
    if (String(calendar.owner) !== req.user.id) return res.status(403).json({ error: 'No permission' });

    const userToShare = await User.findOne({ email });
    if (!userToShare) return res.status(404).json({ error: 'User not found' });

    // Prevent duplicate sharing
    if (calendar.sharedWith.some(sw => String(sw.user) === String(userToShare._id))) {
        return res.status(400).json({ error: 'Already shared with this user' });
    }

    calendar.sharedWith.push({
        user: userToShare._id,
        permissions: permissions || { edit: true, delete: false, rename: false, addEvent: true, deleteEvent: true, editEvent: true }
    });
    await calendar.save();
    res.json({ message: 'Calendar shared' });
});

// Remove calendar (only owner or with delete permission)
router.delete('/:id', auth, async (req, res) => {
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ error: 'Calendar not found' });

    if (String(calendar.owner) === req.user.id) {
        await calendar.deleteOne();
        return res.json({ message: 'Calendar deleted' });
    }
    // If shared, check permission
    const shared = calendar.sharedWith.find(sw => String(sw.user) === req.user.id);
    if (shared && shared.permissions.delete) {
        await calendar.deleteOne();
        return res.json({ message: 'Calendar deleted' });
    }
    res.status(403).json({ error: 'No permission' });
});

// Update calendar (rename, color, etc. - only owner or with edit/rename permission)
router.put('/:id', auth, async (req, res) => {
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ error: 'Calendar not found' });

    let canEdit = String(calendar.owner) === req.user.id;
    if (!canEdit) {
        const shared = calendar.sharedWith.find(sw => String(sw.user) === req.user.id);
        if (shared && (shared.permissions.edit || shared.permissions.rename)) canEdit = true;
    }
    if (!canEdit) return res.status(403).json({ error: 'No permission' });

    Object.assign(calendar, req.body);
    await calendar.save();
    res.json(calendar);
});

module.exports = router;
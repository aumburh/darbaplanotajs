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
        const calendar = await Calendar.findById(req.params.id)
            .populate('sharedWith.user', 'email username'); // <-- Add this line
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

router.post('/:id/share', require('../middleware/auth'), async (req, res) => {
    const { email, permissions } = req.body;
    const calendar = await Calendar.findById(req.params.id).populate('sharedWith.user');
    if (!calendar) return res.status(404).json({ message: 'Not found' });
    if (calendar.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (calendar.sharedWith.some(sw => sw.user.equals(user._id))) {
        return res.status(400).json({ message: 'Already shared' });
    }
    calendar.sharedWith.push({ user: user._id, permissions });
    await calendar.save();
    res.json(calendar);
});

router.delete('/:id/share', require('../middleware/auth'), async (req, res) => {
    const { email } = req.body;
    const calendar = await Calendar.findById(req.params.id).populate('sharedWith.user');
    if (!calendar) return res.status(404).json({ message: 'Not found' });
    if (calendar.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    calendar.sharedWith = calendar.sharedWith.filter(sw => (sw.user.email || sw.user) !== email);
    await calendar.save();
    res.json(calendar);
});

// Remove calendar (only owner or with delete permission)
router.delete('/:id', require('../middleware/auth'), async (req, res) => {
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ message: 'Not found' });
    if (calendar.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    await calendar.deleteOne();
    res.json({ message: 'Deleted' });
});

// Update calendar (rename, color, etc. - only owner or with edit/rename permission)
router.put('/:id', require('../middleware/auth'), async (req, res) => {
    const { name, color } = req.body;
    const calendar = await Calendar.findById(req.params.id);
    if (!calendar) return res.status(404).json({ message: 'Not found' });
    if (calendar.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
    calendar.name = name;
    calendar.color = color;
    await calendar.save();
    res.json(calendar);
});

module.exports = router;
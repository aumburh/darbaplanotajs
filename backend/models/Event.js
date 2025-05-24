const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    calendarId: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' },
    day: Number,
    month: Number,
    year: Number,
    eventText: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
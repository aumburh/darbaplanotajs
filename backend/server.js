require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, '../frontend')));  // Serve static files from 'frontend' directory

app.use(cors());
app.use(express.json());

// Serve frontend index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));  // Correct path to index.html
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Calendar Schema
const CalendarSchema = new mongoose.Schema({
    name: String,
    color: String,
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],  // Reference to Event model
    createdAt: { type: Date, default: Date.now }
});

const Calendar = mongoose.model('Calendar', CalendarSchema);

// Event Schema
const EventSchema = new mongoose.Schema({
    calendarId: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' },
    day: Number,
    month: Number,
    year: Number,
    eventText: String,
    createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', EventSchema);

// Create a new calendar
app.post('/calendars', async (req, res) => {
    try {
        // Create a new calendar document
        const newCalendar = new Calendar(req.body);

        // Save the new calendar
        await newCalendar.save();

        // Initialize an empty array for events (or you can add default events here if desired)
        newCalendar.events = [];

        // Update the calendar with the empty event list (if needed)
        await newCalendar.save();

        res.json(newCalendar);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all calendars with their events
app.get('/calendars', async (req, res) => {
    try {
        const calendars = await Calendar.find().populate('events');
        res.json(calendars);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single calendar by ID with its events
app.get('/api/kalendars/:id', async (req, res) => {
    try {
        const calendar = await Calendar.findById(req.params.id).populate('events');
        if (!calendar) {
            return res.status(404).json({ error: 'Calendar not found' });
        }
        res.json(calendar);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve the calendar page (HTML Route)
app.get('/kalendars/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/kalendars.html'));  // Correct path to kalendars.html
});

// Create a new event
app.post('/api/events', async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();

        // Add the event to the calendar's events array
        const calendar = await Calendar.findById(req.body.calendarId);
        if (calendar) {
            calendar.events.push(newEvent._id);
            await calendar.save();
        }

        res.json(newEvent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get events for a calendar
app.get('/api/events/:calendarId', async (req, res) => {
    try {
        const events = await Event.find({ calendarId: req.params.calendarId });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete an event by ID
app.delete('/api/events/:id', async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a calendar by ID
app.put('/calendars/:id', async (req, res) => {
    try {
        const updatedCalendar = await Calendar.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedCalendar);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a calendar by ID
app.delete('/calendars/:id', async (req, res) => {
    try {
        await Calendar.findByIdAndDelete(req.params.id);
        res.json({ message: 'Calendar deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a calendar by ID
app.delete('/calendars/:id', async (req, res) => {
    try {
        await Calendar.findByIdAndDelete(req.params.id);
        res.json({ message: 'Calendar deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Backend route for deleting calendar
app.delete('/api/kalendars/:id', async (req, res) => {
    try {
        const calendar = await Calendar.findByIdAndDelete(req.params.id);
        if (!calendar) {
            return res.status(404).json({ error: 'Calendar not found' });
        }
        res.json({ message: 'Calendar deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

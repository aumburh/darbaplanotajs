require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend/pages')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// Calendar Schema
const CalendarSchema = new mongoose.Schema({
    name: String,
    color: String,
    createdAt: { type: Date, default: Date.now }
});

const Calendar = mongoose.model('Calendar', CalendarSchema);

// API Routes

// Create a new calendar
app.post('/calendars', async (req, res) => {
    try {
        const newCalendar = new Calendar(req.body);
        await newCalendar.save();
        res.json(newCalendar);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all calendars
app.get('/calendars', async (req, res) => {
    const calendars = await Calendar.find();
    res.json(calendars);
});

// Get a single calendar by ID (API Route)
app.get('/api/kalendars/:id', async (req, res) => {
    try {
        const calendar = await Calendar.findById(req.params.id);
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
    res.sendFile(path.join(__dirname, '../frontend/pages/kalendars.html'));
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

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

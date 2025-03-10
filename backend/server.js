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
app.post('/calendars', async (req, res) => {
    try {
        const newCalendar = new Calendar(req.body);
        await newCalendar.save();
        res.json(newCalendar);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/calendars', async (req, res) => {
    const calendars = await Calendar.find();
    res.json(calendars);
});

app.put('/calendars/:id', async (req, res) => {
    try {
        const updatedCalendar = await Calendar.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedCalendar);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/calendars/:id', async (req, res) => {
    try {
        await Calendar.findByIdAndDelete(req.params.id);
        res.json({ message: 'Calendar deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

    require('dotenv').config();
    const express = require('express');
    const mongoose = require('mongoose');
    const cors = require('cors');
    const path = require('path');
    const jwt = require('jsonwebtoken');
    const User = require('./models/User');  // Corrected path to User model

    const app = express();
    const PORT = process.env.PORT || 5000;

    // Middleware
    app.use(cors());
    app.use(express.json());  // Parse incoming JSON requests
    app.use(express.static(path.join(__dirname, '../frontend')));  // Serve static files from 'frontend' directory

    // Serve frontend pages
    app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/index.html')));
    app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/login.html')));
    app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../frontend/pages/admin.html')));

    // Admin credentials (hardcoded for now)
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';

    // Admin user creation
    async function createAdminUser() {
        const existingAdmin = await User.findOne({ email: adminEmail });
    
        if (!existingAdmin) {
            const newAdmin = new User({
                email: adminEmail,
                password: adminPassword,  // Stored as plain text
                isAdmin: true,
                username: 'admin'
            });
    
            await newAdmin.save();
            console.log('Admin user created!');
        } else {
            console.log('Admin user already exists.');
        }
    }
    

    // MongoDB connection
    mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('MongoDB connected');
            createAdminUser();  // Ensure admin user is created on server start
        })
        .catch(err => console.error('MongoDB connection error:', err));

    // Authentication middleware
    const authenticate = (req, res, next) => {
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ error: 'Access denied' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
            next();
        } catch (err) {
            res.status(400).json({ error: 'Invalid token' });
        }
    };

    // Admin authentication middleware
    const authenticateAdmin = async (req, res, next) => {
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ error: 'Access denied' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (user && user.isAdmin) {
                req.userId = decoded.userId;
                next();
            } else {
                return res.status(403).json({ error: 'Not authorized' });
            }
        } catch (err) {
            res.status(400).json({ error: 'Invalid token' });
        }
    };

    // Routes for managing users
    const userRouter = express.Router();

    userRouter.put('/:id/set-admin', async (req, res) => {
        const userId = req.params.id;
        const { isAdmin } = req.body;
    
        console.log(`Updating user ${userId} to admin: ${isAdmin}`);
    
        if (typeof isAdmin !== 'boolean') {
            return res.status(400).json({ error: 'Invalid admin status. Must be true/false.' });
        }
    
        try {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { isAdmin },   // Update the field
                { new: true }  // Return updated document
            );
    
            if (!updatedUser) {
                return res.status(404).json({ error: 'User not found' });
            }
    
            console.log('User updated:', updatedUser);
            res.json({ message: `User admin status set to ${isAdmin}`, user: updatedUser });
        } catch (err) {
            console.error('Error updating user admin status:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });
    


    app.get('/admin/users', async (req, res) => {
        try {
            const users = await User.find();  // Fetch users
            res.json(users);  // Send users data to frontend
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Register the userRouter
    app.use('/api/users', userRouter); // Prefix all user-related routes with /api/users

    // Routes for user authentication
    app.post('/api/login', async (req, res) => {
        const { email, password } = req.body;
    
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
    
        try {
            const user = await User.findOne({ email });
    
            if (!user || user.password !== password) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }
    
            const token = jwt.sign({ userId: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ token, isAdmin: user.isAdmin });
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    

    // Register (POST /api/register)
    app.post('/api/register', async (req, res) => {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        try {
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            const newUser = new User({ username, email, password });
            await newUser.save();

            res.status(201).json({ message: 'User registered successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Routes for calendar and event management
    // Calendar Schema
    const CalendarSchema = new mongoose.Schema({
        name: String,
        color: String,
        events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
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

    // Calendar routes
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
        try {
            const calendars = await Calendar.find().populate('events');
            res.json(calendars);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/calendars/:id', async (req, res) => {
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

    // Event routes
    app.post('/api/events', async (req, res) => {
        try {
            const newEvent = new Event(req.body);
            await newEvent.save();

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

    // Get events for a calendar (GET /api/events/:calendarId)
    app.get('/api/events/:calendarId', async (req, res) => {
        try {
            const events = await Event.find({ calendarId: req.params.calendarId });
            res.json(events);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Delete an event (DELETE /api/events/:id)
    app.delete('/api/events/:id', async (req, res) => {
        try {
            await Event.findByIdAndDelete(req.params.id);
            res.json({ message: 'Event deleted' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.delete('/api/kalendars/:calendarId', async (req, res) => {
        const { calendarId } = req.params;
        try {
            const result = await Calendar.findByIdAndDelete(calendarId);
            if (!result) {
                return res.status(404).send({ error: 'Calendar not found.' });
            }
            res.status(200).send({ message: 'Calendar deleted successfully.' });
        } catch (err) {
            res.status(500).send({ error: 'Server error' });
        }
    });
    
    
    // Get a single calendar by ID
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

    // Start server
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

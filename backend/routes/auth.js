const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

// Register route
router.post('/register', async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) return res.status(400).json({ message: 'All fields required' });
    try {
        const exists = await User.findOne({ $or: [{ email }, { username }] });
        if (exists) return res.status(400).json({ message: 'User already exists' });
        const user = await User.create({ email, password, username });
        res.status(201).json({ message: 'User registered' });
    } catch (e) {
        console.error('Register error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', { email, password }); // Debug: log entered data
    if (!email || !password) return res.status(400).json({ message: 'All fields required' });
    const user = await User.findOne({ email });
    console.log('User from DB:', user); // <-- Add this line to see the DB user and hashed password
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    res.json({ token });
});

// (Optional) Get current user info (protected)
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.id).select('-password');
        res.json(user);
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
});

router.post('/logout', (req, res) => {
    // For stateless JWT, just respond OK
    res.json({ message: 'Logged out' });
});

module.exports = router;
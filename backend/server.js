require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: Allow Authorization header and your frontend's origin
app.use(cors({
  origin: 'http://localhost:5000', // Change if your frontend runs elsewhere
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve HTML pages via explicit routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/login.html"));
});
app.get("/kalendars/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/kalendars.html"));
});

// Serve static assets
app.use(express.static(path.join(__dirname, "../frontend/pages")));
app.use('/style', express.static(path.join(__dirname, '../frontend/style')));
app.use('/script', express.static(path.join(__dirname, '../frontend/script')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Use API routes
app.use("/api/kalendars", require("./routes/calendars"));
app.use("/api/events", require("./routes/events"));
app.use("/api/auth", require("./routes/auth"));

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
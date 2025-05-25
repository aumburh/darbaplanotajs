require("dotenv").config();
// const helmet = require('helmet');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// app.use(helmet());

// Serve frontend files


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

// Serve static assets first
app.use(express.static(path.join(__dirname, "../frontend/pages")));
app.use('/style', express.static(path.join(__dirname, '../frontend/style')));
app.use('/script', express.static(path.join(__dirname, '../frontend/script')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Use routes
app.use("/api/kalendars", require("./routes/calendars"));
app.use("/calendars", require("./routes/calendars"));
app.use("/api/events", require("./routes/events"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auth", require("./routes/auth"));

// Serve the calendar page (HTML Route)
app.get("/kalendars/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/kalendars.html"));
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

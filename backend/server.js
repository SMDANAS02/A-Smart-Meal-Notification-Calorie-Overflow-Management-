// server.js — FitAI Backend Entry Point
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const whatsappRoutes = require("./routes/whatsapp");

// ─────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────

// Allow frontend (Vercel) to call API
app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend if hosted in same project
app.use(express.static(path.join(__dirname, "..", "frontend")));


// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────

app.use("/api/auth", require("./routes/auth"));
app.use("/api/auth", require("./routes/google-auth"));

app.use("/api/profile", require("./routes/profile"));
app.use("/api/meals", require("./routes/meals"));
app.use("/api/progress", require("./routes/progress"));
app.use("/api/diet", require("./routes/diet"));
app.use("/api/water", require("./routes/water"));
app.use("/api/notify", require("./routes/notify"));

// Twilio webhook requires urlencoded
app.use("/api/whatsapp", express.urlencoded({ extended: false }), whatsappRoutes);


// ─────────────────────────────────────────
// BACKGROUND SCHEDULER
// ─────────────────────────────────────────
require("./scheduler");


// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "🔥 FitAI Backend is running!",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});


// ─────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`
  });
});


// ─────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    error: "Internal server error"
  });
});


// ─────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔═══════════════════════════════════╗
║        🔥 FitAI Backend            ║
║   Server running on port ${PORT}   ║
╚═══════════════════════════════════╝
`);
});
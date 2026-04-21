const twilio = require('twilio');

async function sendWelcomeMessage(phone, name) {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${phone}`,
      body: `👋 Hey ${name}! Welcome to FitAI! 🔥\n\nI am your personal fitness bot!\n\n📊 *status* — Today's progress\n🍽️ *log 2 idli* — Log meal\n💧 *water 6* — Update water\n⚖️ *weight 74.5* — Log weight\n💪 *motivate* — Get motivated!\n❓ *help* — All commands\n\nStart your fitness journey now! 💪`
    });
  } catch (err) {
    console.log('Welcome msg failed:', err.message);
  }
}
// routes/auth.js — Register & Login
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email, and password are required.' });

  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing)
    return res.status(409).json({ error: 'Email already registered. Please login.' });

  const hashed = bcrypt.hashSync(password, 10);

  const result = db.prepare(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
  ).run(name, email, hashed);

  db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(result.lastInsertRowid);

  const token = jwt.sign(
    { id: result.lastInsertRowid, email, name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  // Send welcome WhatsApp if phone exists
if (req.body.phone) {
  sendWelcomeMessage(req.body.phone, name);
}

  res.status(201).json({
    message: 'Registration successful!',
    token,
    user: { id: result.lastInsertRowid, name, email }
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user)
    return res.status(401).json({ error: 'Invalid email or password.' });

  const match = bcrypt.compareSync(password, user.password);
  if (!match)
    return res.status(401).json({ error: 'Invalid email or password.' });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    message: 'Login successful!',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Google token is required.' });
  }

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // Create new user
      const result = db.prepare(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
      ).run(name, email, 'google_oauth'); // Dummy password for Google users

      db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(result.lastInsertRowid);

      user = {
        id: result.lastInsertRowid,
        name,
        email
      };
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Google login successful!',
      token: jwtToken,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google token.' });
  }
});

module.exports = router;

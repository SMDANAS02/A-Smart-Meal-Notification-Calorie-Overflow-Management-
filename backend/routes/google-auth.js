// routes/google-auth.js — Google OAuth Login
const express = require('express');
const router  = express.Router();
const { OAuth2Client } = require('google-auth-library');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'No credential provided.' });
  }

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, picture, sub: googleId } = payload;

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      // Create new user
      const hashed = bcrypt.hashSync(googleId + process.env.JWT_SECRET, 10);
      const result = db.prepare(
        'INSERT INTO users (name, email, password, google_id, avatar) VALUES (?, ?, ?, ?, ?)'
      ).run(name, email, hashed, googleId, picture);

      // Create empty profile
      db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(result.lastInsertRowid);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } else {
      // Update google_id if not set
      if (!user.google_id) {
        db.prepare('UPDATE users SET google_id = ?, avatar = ? WHERE id = ?')
          .run(googleId, picture, user.id);
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Google login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: picture }
    });

  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Invalid Google token. Please try again.' });
  }
});

module.exports = router;
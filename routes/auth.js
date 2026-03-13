// routes/auth.js — Register & Login
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');

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

module.exports = router;

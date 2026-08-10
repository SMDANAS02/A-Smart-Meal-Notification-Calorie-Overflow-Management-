// routes/foods.js — Food Database API
const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/foods — Get all foods or search by name
router.get('/', auth, (req, res) => {
  try {
    const { search, category, limit } = req.query;
    
    let query = 'SELECT * FROM foods';
    const params = [];
    const conditions = [];
    
    // Search by name
    if (search) {
      conditions.push('name LIKE ?');
      params.push(`%${search}%`);
    }
    
    // Filter by category
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    
    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Order by name
    query += ' ORDER BY name ASC';
    
    // Limit results
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }
    
    const foods = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      count: foods.length,
      foods
    });
  } catch (err) {
    console.error('Error fetching foods:', err);
    res.status(500).json({ error: 'Failed to fetch foods' });
  }
});

// GET /api/foods/:id — Get single food by ID
router.get('/:id', auth, (req, res) => {
  try {
    const food = db.prepare('SELECT * FROM foods WHERE id = ?').get(req.params.id);
    
    if (!food) {
      return res.status(404).json({ error: 'Food not found' });
    }
    
    res.json({ success: true, food });
  } catch (err) {
    console.error('Error fetching food:', err);
    res.status(500).json({ error: 'Failed to fetch food' });
  }
});

// GET /api/foods/search/:name — Search food by exact or partial name
router.get('/search/:name', auth, (req, res) => {
  try {
    const searchTerm = req.params.name.toLowerCase();
    
    // Try exact match first
    let food = db.prepare('SELECT * FROM foods WHERE LOWER(name) = ?').get(searchTerm);
    
    // If no exact match, try partial match
    if (!food) {
      const foods = db.prepare('SELECT * FROM foods WHERE LOWER(name) LIKE ? ORDER BY name ASC LIMIT 10')
        .all(`%${searchTerm}%`);
      
      return res.json({
        success: true,
        exactMatch: false,
        count: foods.length,
        foods
      });
    }
    
    res.json({
      success: true,
      exactMatch: true,
      food
    });
  } catch (err) {
    console.error('Error searching food:', err);
    res.status(500).json({ error: 'Failed to search food' });
  }
});

// GET /api/foods/categories — Get all available categories
router.get('/meta/categories', auth, (req, res) => {
  try {
    const categories = db.prepare('SELECT DISTINCT category FROM foods ORDER BY category').all();
    
    res.json({
      success: true,
      categories: categories.map(c => c.category)
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/foods — Add new food (admin only for future)
router.post('/', auth, (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, unit, category } = req.body;
    
    if (!name || !calories || !protein || !carbs || !fat || !unit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = db.prepare(`
      INSERT INTO foods (name, calories, protein, carbs, fat, unit, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, calories, protein, carbs, fat, unit, category || 'Other');
    
    res.json({
      success: true,
      message: 'Food added successfully',
      foodId: result.lastInsertRowid
    });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(409).json({ error: 'Food already exists' });
    }
    console.error('Error adding food:', err);
    res.status(500).json({ error: 'Failed to add food' });
  }
});

module.exports = router;

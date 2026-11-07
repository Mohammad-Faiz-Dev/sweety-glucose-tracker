const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

function validateReading(body) {
  const { date, time_slot, value } = body;

  if (value === undefined || value === null || value === '') {
    return { field: 'value', message: 'Please enter a glucose value.' };
  }
  const numValue = Number(value);
  if (!Number.isInteger(numValue) || numValue < 40 || numValue > 600) {
    return { field: 'value', message: 'Value must be between 40 and 600 mg/dl.' };
  }
  if (!date) {
    return { field: 'date', message: 'Date is required.' };
  }
  const today = new Date().toISOString().split('T')[0];
  if (date > today) {
    return { field: 'date', message: 'Date cannot be in the future.' };
  }
  if (!time_slot || !SLOTS.includes(time_slot)) {
    return { field: 'time_slot', message: 'Invalid time slot.' };
  }
  return null;
}

router.get('/', async (req, res) => {
  const { page = 1, limit = 50, from, to } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  try {
    let query = 'SELECT * FROM readings WHERE user_id = $1';
    const params = [req.user.id];
    let paramIdx = 2;
    if (from) {
      query += ` AND date >= $${paramIdx}`;
      params.push(from);
      paramIdx++;
    }
    if (to) {
      query += ` AND date <= $${paramIdx}`;
      params.push(to);
      paramIdx++;
    }
    query += ' ORDER BY date DESC, id DESC LIMIT $' + paramIdx + ' OFFSET $' + (paramIdx + 1);
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);
    res.json({
      readings: result.rows,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const error = validateReading(req.body);
  if (error) return res.status(400).json(error);

  const { date, time_slot, value } = req.body;
  try {
    const existing = await pool.query(
      'SELECT id FROM readings WHERE user_id = $1 AND date = $2 AND time_slot = $3',
      [req.user.id, date, time_slot]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({
        field: 'time_slot',
        message: `You already have an ${time_slot} reading for this date.`
      });
    }
    const count = await pool.query(
      'SELECT COUNT(*) FROM readings WHERE user_id = $1 AND date = $2',
      [req.user.id, date]
    );
    if (Number(count.rows[0].count) >= 4) {
      return res.status(400).json({
        message: 'You can add only 4 readings per day.'
      });
    }

    const result = await pool.query(
      `INSERT INTO readings (user_id, date, time_slot, value)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, date, time_slot, Number(value)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(400).json({
        message: `You already have an ${time_slot} reading for this date.`
      });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const error = validateReading(req.body);
  if (error) return res.status(400).json(error);

  const { date, time_slot, value } = req.body;
  try {
    const existing = await pool.query(
      'SELECT * FROM readings WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Reading not found' });
    }

    const dup = await pool.query(
      'SELECT id FROM readings WHERE user_id = $1 AND date = $2 AND time_slot = $3 AND id != $4',
      [req.user.id, date, time_slot, id]
    );
    if (dup.rows.length > 0) {
      return res.status(400).json({
        field: 'time_slot',
        message: `You already have an ${time_slot} reading for this date.`
      });
    }

    if (date !== existing.rows[0].date) {
      const count = await pool.query(
        'SELECT COUNT(*) FROM readings WHERE user_id = $1 AND date = $2 AND id != $3',
        [req.user.id, date, id]
      );
      if (Number(count.rows[0].count) >= 4) {
        return res.status(400).json({
          message: 'You can add only 4 readings per day.'
        });
      }
    }

    const result = await pool.query(
      `UPDATE readings SET date = $1, time_slot = $2, value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [date, time_slot, Number(value), id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reading not found' });
    }
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

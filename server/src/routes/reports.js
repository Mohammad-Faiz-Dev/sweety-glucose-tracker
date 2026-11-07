const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

function getDateRange(type, selectedDate) {
  const date = new Date(selectedDate + 'T00:00:00');
  if (isNaN(date.getTime())) return null;

  if (type === 'daily') {
    return { start: selectedDate, end: selectedDate };
  }
  if (type === 'weekly') {
    const start = new Date(date);
    start.setDate(date.getDate() - 6);
    return {
      start: start.toISOString().split('T')[0],
      end: selectedDate
    };
  }
  if (type === 'mtd') {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    return {
      start: start.toISOString().split('T')[0],
      end: selectedDate
    };
  }
  if (type === 'monthly') {
    const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const end = new Date(date.getFullYear(), date.getMonth(), 0);
    return {
      start: prev.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  }
  return null;
}

router.get('/', async (req, res) => {
  const { type = 'daily', date } = req.query;
  if (!date) {
    return res.status(400).json({ message: 'Date is required' });
  }
  if (!['daily', 'weekly', 'mtd', 'monthly'].includes(type)) {
    return res.status(400).json({ message: 'Invalid report type' });
  }

  const range = getDateRange(type, date);
  if (!range) {
    return res.status(400).json({ message: 'Invalid date' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM readings
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date, time_slot`,
      [req.user.id, range.start, range.end]
    );
    const readings = result.rows;
    const count = readings.length;

    if (count === 0) {
      return res.json({
        type,
        start: range.start,
        end: range.end,
        count: 0,
        highest: null,
        lowest: null,
        average: null,
        timeInRange: null,
        highCount: 0,
        lowCount: 0,
        readings: []
      });
    }

    const values = readings.map(r => r.value);
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const average = Math.round((values.reduce((a, b) => a + b, 0) / count) * 10) / 10;
    const inRange = values.filter(v => v >= 70 && v <= 140).length;
    const timeInRange = Math.round((inRange / count) * 1000) / 10;
    const highCount = values.filter(v => v > 140).length;
    const lowCount = values.filter(v => v < 70).length;

    res.json({
      type,
      start: range.start,
      end: range.end,
      count,
      highest,
      lowest,
      average,
      timeInRange,
      highCount,
      lowCount,
      readings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

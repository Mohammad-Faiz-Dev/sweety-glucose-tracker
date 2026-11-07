const bcrypt = require('bcrypt');
const pool = require('./pool');

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

function randomValue() {
  return Math.floor(Math.random() * (180 - 70 + 1)) + 70;
}

async function seed() {
  const client = await pool.connect();
  try {
    const passwordHash = await bcrypt.hash('Demo1234!', 10);
    const userResult = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Demo User', 'demo@sweety.app', passwordHash]
    );
    const userId = userResult.rows[0].id;

    // Clear existing readings for demo user
    await client.query('DELETE FROM readings WHERE user_id = $1', [userId]);

    const today = new Date();
    const readings = [];

    // Last 30 days
    for (let d = 0; d < 30; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      const numSlots = Math.floor(Math.random() * 3) + 2; // 2-4
      const shuffled = [...SLOTS].sort(() => 0.5 - Math.random());
      for (let i = 0; i < numSlots; i++) {
        readings.push([userId, dateStr, shuffled[i], randomValue()]);
      }
    }

    for (const r of readings) {
      await client.query(
        `INSERT INTO readings (user_id, date, time_slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        r
      );
    }

    console.log(`Seeded demo user and ${readings.length} readings`);
  } catch (err) {
    console.error('Seed failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

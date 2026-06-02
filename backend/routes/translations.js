const router = require('express').Router();
const db = require('../db');

router.get('/languages', async (_, res) => {
  const [rows] = await db.query('SELECT * FROM languages WHERE is_active=1');
  res.json(rows);
});

router.get('/:lang', async (req, res) => {
  const [rows] = await db.execute(
    'SELECT ui_key, value FROM translations WHERE language_code=?',
    [req.params.lang]
  );
  const map = Object.fromEntries(rows.map(r => [r.ui_key, r.value]));
  res.json(map);
});

router.post('/', async (req, res) => {
  const { language_code, ui_key, value } = req.body;
  await db.execute(
    'INSERT INTO translations (language_code,ui_key,value) VALUES (?,?,?) ON DUPLICATE KEY UPDATE value=VALUES(value)',
    [language_code, ui_key, value]
  );
  res.json({ ok: true });
});

module.exports = router;

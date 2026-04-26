const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

router.use(auth);

router.get('/', async (req, res) => {
  const { patient_id, record_id } = req.query;
  const where = [];
  const params = [];
  if (patient_id) { where.push('patient_id=?'); params.push(patient_id); }
  if (record_id) { where.push('record_id=?'); params.push(record_id); }
  const sql = `SELECT * FROM notes ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC`;
  const [rows] = await db.query(sql, params);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { patient_id, record_id, content } = req.body;
  const [r] = await db.execute(
    'INSERT INTO notes (patient_id,record_id,author_id,type,content) VALUES (?,?,?,?,?)',
    [patient_id || null, record_id || null, req.user.id, 'text', content]
  );
  res.status(201).json({ id: r.insertId });
});

router.delete('/:id', async (req, res) => {
  await db.execute('DELETE FROM notes WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;

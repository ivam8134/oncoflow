const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

router.use(auth);

router.get('/', async (_, res) => {
  const [rows] = await db.query('SELECT * FROM patients ORDER BY id DESC');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM patients WHERE id=?', [req.params.id]);
  rows[0] ? res.json(rows[0]) : res.status(404).json({ error: 'Not found' });
});

router.post('/', async (req, res) => {
  const { full_name, birth_date, gender, phone, email, diagnosis, doctor_id } = req.body;
  const [r] = await db.execute(
    'INSERT INTO patients (full_name,birth_date,gender,phone,email,diagnosis,doctor_id) VALUES (?,?,?,?,?,?,?)',
    [full_name, birth_date, gender, phone, email, diagnosis, doctor_id || req.user.id]
  );
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', async (req, res) => {
  const { full_name, birth_date, gender, phone, email, diagnosis } = req.body;
  await db.execute(
    'UPDATE patients SET full_name=?,birth_date=?,gender=?,phone=?,email=?,diagnosis=? WHERE id=?',
    [full_name, birth_date, gender, phone, email, diagnosis, req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await db.execute('DELETE FROM patients WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;

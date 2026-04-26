const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

router.use(auth);

router.get('/', async (req, res) => {
  const { patient_id } = req.query;
  const sql = patient_id
    ? 'SELECT * FROM medical_records WHERE patient_id=? ORDER BY record_date DESC'
    : 'SELECT * FROM medical_records ORDER BY record_date DESC';
  const [rows] = await db.query(sql, patient_id ? [patient_id] : []);
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { patient_id, title, description, record_date } = req.body;
  const [r] = await db.execute(
    'INSERT INTO medical_records (patient_id,doctor_id,title,description,record_date) VALUES (?,?,?,?,?)',
    [patient_id, req.user.id, title, description, record_date]
  );
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', async (req, res) => {
  const { title, description, record_date } = req.body;
  await db.execute(
    'UPDATE medical_records SET title=?,description=?,record_date=? WHERE id=?',
    [title, description, record_date, req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await db.execute('DELETE FROM medical_records WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;

const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

router.use(auth);

router.get('/', async (_, res) => {
  const [rows] = await db.query('SELECT * FROM appointments ORDER BY scheduled_at DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { patient_id, doctor_id, scheduled_at, reason } = req.body;
  const [r] = await db.execute(
    'INSERT INTO appointments (patient_id,doctor_id,scheduled_at,reason) VALUES (?,?,?,?)',
    [patient_id, doctor_id || req.user.id, scheduled_at, reason]
  );
  res.status(201).json({ id: r.insertId });
});

router.put('/:id', async (req, res) => {
  const { scheduled_at, status, reason } = req.body;
  await db.execute(
    'UPDATE appointments SET scheduled_at=?,status=?,reason=? WHERE id=?',
    [scheduled_at, status, reason, req.params.id]
  );
  res.json({ ok: true });
});

router.delete('/:id', async (req, res) => {
  await db.execute('DELETE FROM appointments WHERE id=?', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;

const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

router.use(auth);

router.get('/models', async (_, res) => {
  const [rows] = await db.query('SELECT * FROM ai_models');
  res.json(rows);
});

router.post('/predict', async (req, res) => {
  const { model_id, patient_id, record_id, input } = req.body;
  const result = { label: 'placeholder', notes: 'AI not wired yet' };
  const confidence = 0.0;
  const [r] = await db.execute(
    'INSERT INTO ai_predictions (model_id,patient_id,record_id,input,result,confidence) VALUES (?,?,?,?,?,?)',
    [model_id, patient_id || null, record_id || null, JSON.stringify(input || {}), JSON.stringify(result), confidence]
  );
  res.json({ id: r.insertId, result, confidence });
});

module.exports = router;

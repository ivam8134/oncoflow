const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

router.use(auth);

router.get('/survival-csv', async (req, res) => {
  const [patients] = await db.query('SELECT * FROM patients');

  const [predictions] = await db.query(`
    SELECT ap.patient_id, ap.result, ap.confidence, ap.created_at
    FROM ai_predictions ap
    INNER JOIN (
      SELECT patient_id, MAX(id) as max_id FROM ai_predictions GROUP BY patient_id
    ) latest ON ap.id = latest.max_id
  `);

  const predMap = {};
  for (const p of predictions) {
    predMap[p.patient_id] = JSON.parse(p.result);
  }

  const headers = [
    'patient_id','cancer_type','stage','gender',
    'recommended_treatment','predicted_stage',
    'survival_probability_5yr','recurrence_risk',
    'survival_label','recurrence_label'
  ];

  const rows = patients.map(p => {
    const pred = predMap[p.id] || {};
    return [
      p.id,
      p.diagnosis || 'Unknown',
      pred.predicted_stage || 'N/A',
      p.gender || 'N/A',
      pred.recommended_treatment || 'N/A',
      pred.predicted_stage || 'N/A',
      pred.survival_probability_5yr != null ? (pred.survival_probability_5yr * 100).toFixed(1) + '%' : 'N/A',
      pred.recurrence_risk != null ? (pred.recurrence_risk * 100).toFixed(1) + '%' : 'N/A',
      pred.survival_label || 'N/A',
      pred.recurrence_label || 'N/A',
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="survival_statistics.csv"');
  res.send(csv);
});

module.exports = router;
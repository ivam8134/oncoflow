/**
 * backend/routes/ai.js
 *
 * Bridges OncoFlow's Node backend to the Python FastAPI model server.
 *
 * Endpoints:
 *   GET  /api/ai/models   — list available models (from DB)
 *   POST /api/ai/predict  — run multimodal prediction, save to DB, return result
 *   GET  /api/ai/health   — check if Python model server is reachable
 */

const router = require('express').Router();
const db     = require('../db');
const { auth } = require('../auth');

const MODEL_SERVER_URL = process.env.MODEL_SERVER_URL || 'http://localhost:8000';

router.use(auth);

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalise raw clinical values to [0, 1] so they match training scale.
 * Adjust the ranges below if your actual patient data uses different units.
 */
function normaliseClinical(raw) {
  const clamp = (v, min, max) => Math.min(Math.max((v - min) / (max - min), 0), 1);
  return {
    age:                  clamp(raw.age ?? 50,                  20,  90),
    tumor_size_cm:        clamp(raw.tumor_size_cm ?? 2,          0,  15),
    stage:                clamp((raw.stage ?? 2) - 1,            0,   3),   // 1-4 → 0-1
    lymph_nodes_positive: clamp(raw.lymph_nodes_positive ?? 0,   0,  20),
    er_status:            raw.er_status  ? 1 : 0,
    pr_status:            raw.pr_status  ? 1 : 0,
    her2_status:          raw.her2_status ? 1 : 0,
    ki67_percent:         clamp(raw.ki67_percent ?? 20,           0, 100),
    prior_chemo:          raw.prior_chemo     ? 1 : 0,
    prior_radiation:      raw.prior_radiation ? 1 : 0,
  };
}

// ── Routes ─────────────────────────────────────────────────────────────────

/**
 * GET /api/ai/models
 * Returns the list of registered AI models from the database.
 */
router.get('/models', async (_req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ai_models');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ai/health
 * Pings the Python model server and returns its status.
 */
router.get('/health', async (_req, res) => {
  try {
    const response = await fetch(`${MODEL_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    res.json({ model_server: data, node_backend: 'ok' });
  } catch (err) {
    res.status(503).json({
      node_backend: 'ok',
      model_server: 'unreachable',
      error: err.message,
    });
  }
});

/**
 * POST /api/ai/predict
 *
 * Expected body:
 * {
 *   patient_id: number,           // optional — saves to DB if provided
 *   record_id:  number,           // optional
 *   model_id:   number,           // optional — defaults to 1
 *   genomic: {                    // binary mutation flags (0 or 1)
 *     BRCA1, BRCA2, TP53, PIK3CA, PTEN, ERBB2, EGFR, KRAS, BRAF, ALK
 *   },
 *   clinical: {                   // raw (un-normalised) clinical values
 *     age, tumor_size_cm, stage (1-4), lymph_nodes_positive,
 *     er_status, pr_status, her2_status, ki67_percent,
 *     prior_chemo, prior_radiation
 *   },
 *   report: "Free-text pathology report..."
 * }
 */
router.post('/predict', async (req, res) => {
  const {
    patient_id,
    record_id,
    model_id = 1,
    genomic  = {},
    clinical = {},
    report   = 'No pathology report provided.',
  } = req.body;

  // Build the payload for the Python server
  const pythonPayload = {
    patient_id: patient_id ? String(patient_id) : null,
    genomic: {
      BRCA1:  genomic.BRCA1  ?? 0,
      BRCA2:  genomic.BRCA2  ?? 0,
      TP53:   genomic.TP53   ?? 0,
      PIK3CA: genomic.PIK3CA ?? 0,
      PTEN:   genomic.PTEN   ?? 0,
      ERBB2:  genomic.ERBB2  ?? 0,
      EGFR:   genomic.EGFR   ?? 0,
      KRAS:   genomic.KRAS   ?? 0,
      BRAF:   genomic.BRAF   ?? 0,
      ALK:    genomic.ALK    ?? 0,
    },
    clinical: normaliseClinical(clinical),
    report,
  };

  let modelResult;
  try {
    const response = await fetch(`${MODEL_SERVER_URL}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(pythonPayload),
      signal:  AbortSignal.timeout(30000),   // 30-second timeout
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({
        error: 'Model server error',
        detail: errText,
      });
    }

    modelResult = await response.json();
  } catch (err) {
    return res.status(503).json({
      error: 'Could not reach model server',
      detail: err.message,
      hint:   `Make sure the Python server is running at ${MODEL_SERVER_URL}`,
    });
  }

  // Persist the prediction to the database
  try {
    const input = JSON.stringify({ genomic, clinical, report });
    const result = JSON.stringify({
      recommended_treatment:    modelResult.recommended_treatment,
      predicted_stage:          modelResult.predicted_stage,
      survival_probability_5yr: modelResult.survival_probability_5yr,
      recurrence_risk:          modelResult.recurrence_risk,
      survival_label:           modelResult.survival_label,
      recurrence_label:         modelResult.recurrence_label,
    });
    const confidence = modelResult.treatment_probabilities
      ? Math.max(
          modelResult.treatment_probabilities.Chemotherapy,
          modelResult.treatment_probabilities.HormoneTherapy,
          modelResult.treatment_probabilities.TargetedTherapy,
        )
      : 0;

    const [r] = await db.execute(
      `INSERT INTO ai_predictions
         (model_id, patient_id, record_id, input, result, confidence)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [model_id, patient_id ?? null, record_id ?? null, input, result, confidence]
    );

    return res.json({
      prediction_id: r.insertId,
      ...modelResult,
    });
  } catch (dbErr) {
    // Return the model result even if DB write fails
    console.error('[ai/predict] DB write failed:', dbErr.message);
    return res.json({
      prediction_id: null,
      db_warning: 'Result not saved to database',
      ...modelResult,
    });
  }
});

module.exports = router;

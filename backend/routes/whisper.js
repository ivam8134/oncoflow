const router = require('express').Router();
const multer = require('multer');
const { auth } = require('../auth');
const FormData = require('form-data');
const fetch = require('node-fetch');

const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:9000';
const upload = multer({ storage: multer.memoryStorage() });

router.use(auth);

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  try {
    const form = new FormData();
    form.append('audio', req.file.buffer, {
      filename: req.file.originalname || 'recording.webm',
      contentType: req.file.mimetype || 'audio/webm',
    });

    // Forward optional language hint from the React client
    if (req.body.language) {
      form.append('language', req.body.language);
    }

    const response = await fetch(`${WHISPER_URL}/transcribe`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(502).json({ error: 'Whisper service error', detail: err });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(503).json({
      error: 'Cannot reach Whisper service',
      hint: `Make sure whisper-service is running at ${WHISPER_URL}`,
      detail: err.message,
    });
  }
});

module.exports = router;
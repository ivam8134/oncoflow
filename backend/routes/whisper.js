const router = require('express').Router();
const multer = require('multer');
const { auth } = require('../auth');
const FormData = require('form-data');
const fetch = require('node-fetch'); // npm install node-fetch@2

const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:9000';

// Store audio in memory, not disk (we forward it directly)
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
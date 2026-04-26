const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { auth } = require('../auth');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_, file, cb) => cb(null, `voice_${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

router.use(auth);

router.post('/', upload.single('audio'), async (req, res) => {
  const { patient_id, record_id, transcription } = req.body;
  const audio_path = req.file ? `/uploads/${req.file.filename}` : null;
  const [r] = await db.execute(
    'INSERT INTO notes (patient_id,record_id,author_id,type,audio_path,transcription) VALUES (?,?,?,?,?,?)',
    [patient_id || null, record_id || null, req.user.id, 'voice', audio_path, transcription || null]
  );
  res.status(201).json({ id: r.insertId, audio_path });
});

module.exports = router;

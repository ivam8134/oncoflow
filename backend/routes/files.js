const router = require('express').Router();
const multer = require('multer');
const db = require('../db');
const { auth } = require('../auth');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});
const upload = multer({ storage });

router.use(auth);

router.post('/', upload.single('file'), async (req, res) => {
  const { patient_id, record_id, category = 'other' } = req.body;
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const [r] = await db.execute(
    'INSERT INTO files (patient_id,record_id,uploader_id,filename,path,mime_type,size,category) VALUES (?,?,?,?,?,?,?,?)',
    [patient_id || null, record_id || null, req.user.id, req.file.originalname,
     `/uploads/${req.file.filename}`, req.file.mimetype, req.file.size, category]
  );
  res.status(201).json({ id: r.insertId, path: `/uploads/${req.file.filename}` });
});

router.get('/', async (_, res) => {
  const [rows] = await db.query('SELECT * FROM files ORDER BY id DESC');
  res.json(rows);
});

module.exports = router;

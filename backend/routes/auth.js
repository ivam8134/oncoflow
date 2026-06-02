const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

router.post('/register', async (req, res) => {
  const { name, email, password, role = 'doctor' } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const [r] = await db.execute(
    'INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',
    [name, email, hash, role]
  );
  res.status(201).json({ id: r.insertId, name, email, role });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.execute('SELECT * FROM users WHERE email=?', [email]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

module.exports = router;

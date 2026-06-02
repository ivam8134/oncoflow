const router = require('express').Router();
const db = require('../db');
const { auth } = require('../auth');

router.use(auth);

router.get('/', async (req, res) => {
  const [rows] = await db.execute(
    'SELECT * FROM chat_history WHERE user_id=? ORDER BY id DESC LIMIT 100',
    [req.user.id]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { question } = req.body;
  const response = `Echo: ${question}`;
  const [r] = await db.execute(
    'INSERT INTO chat_history (user_id,question,response) VALUES (?,?,?)',
    [req.user.id, question, response]
  );
  res.json({ id: r.insertId, question, response });
});

module.exports = router;

const router = require('express').Router();

router.post('/', async (req, res) => {
  const { messages, system } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system,
      messages,
    }),
  });

  const data = await response.json();
  console.log('Anthropic response status:', response.status);
  console.log('Anthropic response:', JSON.stringify(data));
  res.json(data);
});

module.exports = router;
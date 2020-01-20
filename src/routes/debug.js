import { Router } from 'express';

const router = Router();

router.get('/lucky', async (req, res) => {
  const luckyNumber = Math.floor(Math.random() * 100 + 1);
  return res.send(`Your lucky number is: ${luckyNumber}`);
});

export default router;

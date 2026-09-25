import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, refresh } from '../controllers/authController';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per IP per window
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);

export default router;

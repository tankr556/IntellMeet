import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getProfile, updateProfile } from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Admin-only route example as requested in Week 1 Day 3 prompt
router.get('/admin-dashboard', authorize('Admin'), (req, res) => {
  res.status(200).json({ message: 'Welcome to Admin Dashboard', stats: { totalUsers: 42, activeMeetings: 3 } });
});

export default router;

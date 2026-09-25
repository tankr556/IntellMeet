import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createMeeting,
  getMeetings,
  getMeetingById,
  updateMeeting,
  deleteMeeting,
} from '../controllers/meetingController';

const router = Router();

router.use(authenticate);

router.post('/', createMeeting);
router.get('/', getMeetings);
router.get('/:id', getMeetingById);
router.put('/:id', updateMeeting);
router.delete('/:id', deleteMeeting);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  addTranscriptSegment,
  processMeetingAI,
  getMeetingSummary,
  convertActionItemToTask,
  getTasks,
  updateTaskStatus,
} from '../controllers/aiController';

const router = Router();

router.use(authenticate);

// AI & Transcript Routes
router.post('/transcript', addTranscriptSegment);
router.post('/process', processMeetingAI);
router.get('/summary/:meetingId', getMeetingSummary);

// Action Items -> Kanban Tasks Routes
router.post('/tasks/convert', convertActionItemToTask);
router.get('/tasks', getTasks);
router.patch('/tasks/:taskId', updateTaskStatus);

export default router;

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { MeetingSummary } from '../models/MeetingSummary';
import { Transcript } from '../models/Transcript';
import { Task } from '../models/Task';
import { generateMeetingIntelligence } from '../services/aiService';

// Save or Append Transcript Segments
export const addTranscriptSegment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId, speakerName, text, timestamp } = req.body;

    let transcript = await Transcript.findOne({ meetingId });
    if (!transcript) {
      transcript = new Transcript({ meetingId, segments: [], fullText: '' });
    }

    transcript.segments.push({ speakerName, text, timestamp });
    transcript.fullText += ` [${timestamp}] ${speakerName}: ${text}`;
    await transcript.save();

    res.status(200).json({ message: 'Transcript segment saved', transcript });
  } catch (error) {
    res.status(500).json({ message: 'Error saving transcript', error });
  }
};

// Generate AI Summary & Action Items for a Meeting
export const processMeetingAI = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.body;

    let transcript = await Transcript.findOne({ meetingId });
    const sampleText = transcript?.fullText || "Sarah Chen: We need to refine the user flow and update Figma components. Rakesh Tank: I will configure the OpenAI Whisper transcription and summary pipeline. David K: I will audit JWT security.";

    const aiResult = await generateMeetingIntelligence(sampleText);

    let summary = await MeetingSummary.findOne({ meetingId });
    if (!summary) {
      summary = new MeetingSummary({
        meetingId,
        summaryText: aiResult.summaryText,
        keyTakeaways: aiResult.keyTakeaways,
        actionItems: aiResult.actionItems,
      });
    } else {
      summary.summaryText = aiResult.summaryText;
      summary.keyTakeaways = aiResult.keyTakeaways;
      summary.actionItems = aiResult.actionItems;
    }

    await summary.save();

    res.status(200).json({ message: 'AI meeting intelligence generated successfully', summary });
  } catch (error) {
    res.status(500).json({ message: 'Error processing AI meeting summary', error });
  }
};

// Get Post-Meeting Summary Dashboard Data
export const getMeetingSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.params;
    let summary = await MeetingSummary.findOne({ meetingId });

    if (!summary) {
      // Auto-generate sample AI summary if not generated yet
      const sampleText = "Sarah Chen: We need to refine user flow. Rakesh Tank: OpenAI Whisper setup. David K: Security audit.";
      const aiResult = await generateMeetingIntelligence(sampleText);
      summary = await MeetingSummary.create({
        meetingId,
        summaryText: aiResult.summaryText,
        keyTakeaways: aiResult.keyTakeaways,
        actionItems: aiResult.actionItems,
      });
    }

    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching summary', error });
  }
};

// Convert AI Action Item into Real Kanban Task
export const convertActionItemToTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId, taskTitle, assigneeName, status, dueDate } = req.body;

    const newTask = await Task.create({
      title: taskTitle,
      meetingId,
      assigneeName: assigneeName || 'Unassigned',
      status: status || 'To Do',
      dueDate: dueDate || 'Next Sprint',
    });

    res.status(201).json({ message: 'Action item converted to Kanban task', task: newTask });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error });
  }
};

// Kanban Board REST API: Get All Tasks
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
};

// Kanban Board REST API: Update Task Status (Drag and Drop)
export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(taskId, { status }, { new: true });
    res.status(200).json({ message: 'Task status updated', task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task status', error });
  }
};

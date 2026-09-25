import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Meeting } from '../models/Meeting';

export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, scheduledAt } = req.body;
    const hostId = req.user?.userId;

    const meeting = await Meeting.create({
      title,
      hostId,
      scheduledAt: scheduledAt || new Date(),
      participants: [hostId],
    });

    res.status(201).json({ message: 'Meeting created successfully', meeting });
  } catch (error) {
    res.status(500).json({ message: 'Error creating meeting', error });
  }
};

export const getMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const meetings = await Meeting.find({
      $or: [{ hostId: userId }, { participants: userId }],
    }).populate('hostId', 'name email avatarUrl');

    res.status(200).json({ meetings });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meetings', error });
  }
};

export const getMeetingById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id)
      .populate('hostId', 'name email avatarUrl')
      .populate('participants', 'name email avatarUrl');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    res.status(200).json({ meeting });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meeting', error });
  }
};

export const updateMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ message: 'Meeting updated successfully', meeting });
  } catch (error) {
    res.status(500).json({ message: 'Error updating meeting', error });
  }
};

export const deleteMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Meeting.findByIdAndDelete(id);
    res.status(200).json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting meeting', error });
  }
};

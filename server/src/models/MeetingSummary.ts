import { Schema, model, Document } from 'mongoose';

export interface IActionItem {
  task: string;
  assigneeName?: string;
  assigneeId?: Schema.Types.ObjectId;
  dueDateGuess?: string;
  status: 'To Do' | 'In Progress' | 'Done';
}

export interface IMeetingSummary extends Document {
  meetingId: Schema.Types.ObjectId;
  summaryText: string;
  keyTakeaways: string[];
  actionItems: IActionItem[];
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSummarySchema = new Schema<IMeetingSummary>(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, unique: true },
    summaryText: { type: String, required: true },
    keyTakeaways: [{ type: String }],
    actionItems: [
      {
        task: { type: String, required: true },
        assigneeName: { type: String, default: 'Unassigned' },
        assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
        dueDateGuess: { type: String, default: 'Next Sprint' },
        status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
      },
    ],
  },
  { timestamps: true }
);

export const MeetingSummary = model<IMeetingSummary>('MeetingSummary', MeetingSummarySchema);

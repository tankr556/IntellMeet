import { Schema, model, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  meetingId?: Schema.Types.ObjectId;
  assigneeName: string;
  assigneeId?: Schema.Types.ObjectId;
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting' },
    assigneeName: { type: String, default: 'Unassigned' },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['To Do', 'In Progress', 'Done'], default: 'To Do' },
    dueDate: { type: String, default: 'Asap' },
  },
  { timestamps: true }
);

export const Task = model<ITask>('Task', TaskSchema);

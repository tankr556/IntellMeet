import { Schema, model, Document } from 'mongoose';

export interface IMeeting extends Document {
  title: string;
  hostId: Schema.Types.ObjectId;
  participants: Schema.Types.ObjectId[];
  scheduledAt: Date;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  recordingUrl?: string;
  transcriptId?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, trim: true },
    hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    scheduledAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' },
    recordingUrl: { type: String, default: '' },
    transcriptId: { type: Schema.Types.ObjectId, ref: 'Transcript' },
  },
  { timestamps: true }
);

export const Meeting = model<IMeeting>('Meeting', MeetingSchema);

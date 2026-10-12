import { Schema, model, Document } from 'mongoose';

export interface ITranscriptSegment {
  speakerName: string;
  text: string;
  timestamp: string;
}

export interface ITranscript extends Document {
  meetingId: Schema.Types.ObjectId;
  segments: ITranscriptSegment[];
  fullText: string;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSchema = new Schema<ITranscript>(
  {
    meetingId: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
    segments: [
      {
        speakerName: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: String, required: true },
      },
    ],
    fullText: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Transcript = model<ITranscript>('Transcript', TranscriptSchema);

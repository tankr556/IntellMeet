import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Member';
  teamId?: Schema.Types.ObjectId;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Member'], default: 'Member' },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    avatarUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);

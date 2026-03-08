import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  totalCreditsRequired: number;
  major: string;
  grade: number;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  totalCreditsRequired: { type: Number, default: 160 },
  major: { type: String, default: '' },
  grade: { type: Number, default: new Date().getFullYear() },
}, { timestamps: true });

export default mongoose.model<IUser>('User', userSchema);

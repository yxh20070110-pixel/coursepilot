import mongoose, { Schema, Document } from 'mongoose';

export interface IPhoto extends Document {
  user: mongoose.Types.ObjectId;
  teacher?: mongoose.Types.ObjectId;
  course?: mongoose.Types.ObjectId;
  imageUrl: string;
  caption?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new Schema<IPhoto>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'Teacher' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  imageUrl: { type: String, required: true },
  caption: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNote: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<IPhoto>('Photo', photoSchema);

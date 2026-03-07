import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  name: string;
  credits: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  courseCode?: string;
  classroom?: string;
  weeks?: string;
  capacity?: number;
  teacher: mongoose.Types.ObjectId;
}

const courseSchema = new Schema<ICourse>({
  name: { type: String, required: true },
  credits: { type: Number, required: true },
  dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  courseCode: { type: String, default: '' },
  classroom: { type: String, default: '' },
  weeks: { type: String, default: '' },
  capacity: { type: Number, default: 0 },
  teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
}, { timestamps: true });

export default mongoose.model<ICourse>('Course', courseSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
  name: string;
  title: string;
  department: string;
  tags: string[];
  researchArea: string;
}

const teacherSchema = new Schema<ITeacher>({
  name: { type: String, required: true },
  title: { type: String, default: '' },
  department: { type: String, default: '' },
  tags: { type: [String], default: [] },
  researchArea: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model<ITeacher>('Teacher', teacherSchema);

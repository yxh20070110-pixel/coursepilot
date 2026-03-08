import mongoose, { Schema, Document } from 'mongoose';

interface IPlanItem {
  courseName: string;
  courseId?: mongoose.Types.ObjectId;
  required: boolean;
}

export interface ITrainingPlan extends Document {
  major: string;
  grade: number;
  semester: number;
  items: IPlanItem[];
}

const planItemSchema = new Schema<IPlanItem>({
  courseName: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course' },
  required: { type: Boolean, default: true },
}, { _id: false });

const trainingPlanSchema = new Schema<ITrainingPlan>({
  major: { type: String, required: true, index: true },
  grade: { type: Number, required: true, index: true },
  semester: { type: Number, required: true, min: 1, max: 12, index: true },
  items: { type: [planItemSchema], default: [] },
}, { timestamps: true });

trainingPlanSchema.index({ major: 1, grade: 1, semester: 1 }, { unique: true });

export default mongoose.model<ITrainingPlan>('TrainingPlan', trainingPlanSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  teachingQuality: number;
  workload: number;
  gradingFairness: number;
  difficulty: number;
  user: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
}

const reviewSchema = new Schema<IReview>({
  teachingQuality: { type: Number, required: true, min: 1, max: 5 },
  workload: { type: Number, required: true, min: 1, max: 5 },
  gradingFairness: { type: Number, required: true, min: 1, max: 5 },
  difficulty: { type: Number, required: true, min: 1, max: 5 },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
}, { timestamps: true });

reviewSchema.index({ user: 1, teacher: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', reviewSchema);

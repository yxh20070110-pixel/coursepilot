import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseReview extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  rating: number;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseReviewSchema = new Schema<ICourseReview>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  content: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
}, { timestamps: true });

courseReviewSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.model<ICourseReview>('CourseReview', courseReviewSchema);

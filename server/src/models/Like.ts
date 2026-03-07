import mongoose, { Schema, Document } from 'mongoose';

export interface ILike extends Document {
  user: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
}

const likeSchema = new Schema<ILike>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
}, { timestamps: true });

likeSchema.index({ user: 1, teacher: 1 }, { unique: true });

export default mongoose.model<ILike>('Like', likeSchema);

import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  isAnonymous: boolean;
  user: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>({
  content: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
}, { timestamps: true });

export default mongoose.model<IComment>('Comment', commentSchema);

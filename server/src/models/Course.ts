import mongoose, { Schema, Document } from 'mongoose';

interface ICourseSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ICourse extends Document {
  name: string;
  credits: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  scheduleSlots: ICourseSlot[];
  courseCode?: string;
  classroom?: string;
  weeks?: string;
  capacity?: number;
  teacher: mongoose.Types.ObjectId;
}

const slotSchema = new Schema<ICourseSlot>({
  dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { _id: false });

const courseSchema = new Schema<ICourse>({
  name: { type: String, required: true },
  credits: { type: Number, required: true },
  dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  scheduleSlots: { type: [slotSchema], default: [] },
  courseCode: { type: String, default: '' },
  classroom: { type: String, default: '' },
  weeks: { type: String, default: '' },
  capacity: { type: Number, default: 0 },
  teacher: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
}, { timestamps: true });

courseSchema.pre('validate', function (next) {
  const slots = (this.scheduleSlots || []).filter((s) => s && s.dayOfWeek && s.startTime && s.endTime);
  if (slots.length > 0) {
    this.dayOfWeek = slots[0].dayOfWeek;
    this.startTime = slots[0].startTime;
    this.endTime = slots[0].endTime;
    this.scheduleSlots = slots;
  } else if (this.dayOfWeek && this.startTime && this.endTime) {
    this.scheduleSlots = [{
      dayOfWeek: this.dayOfWeek,
      startTime: this.startTime,
      endTime: this.endTime,
    }];
  }
  next();
});

export default mongoose.model<ICourse>('Course', courseSchema);

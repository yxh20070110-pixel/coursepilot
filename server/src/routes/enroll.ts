import { Router } from 'express';
import Enrollment from '../models/Enrollment';
import Course from '../models/Course';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/', auth, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.userId!;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: '课程不存在' });

    const existing = await Enrollment.findOne({ user: userId, course: courseId });
    if (existing) return res.status(400).json({ error: '您已选择该课程' });

    const enrollments = await Enrollment.find({ user: userId }).populate('course');

    const conflicting = enrollments.find((e) => {
      const enrolled = e.course as any;
      return (
        enrolled.dayOfWeek === course.dayOfWeek &&
        course.startTime < enrolled.endTime &&
        course.endTime > enrolled.startTime
      );
    });

    if (conflicting) {
      return res.status(409).json({ error: '时间冲突', conflictWith: conflicting.course });
    }

    const enrollment = await Enrollment.create({ user: userId, course: courseId });
    const populated = await Enrollment.findById(enrollment._id).populate({ path: 'course', populate: { path: 'teacher' } });
    res.json(populated);
  } catch {
    res.status(500).json({ error: '选课失败' });
  }
});

router.delete('/', auth, async (req, res) => {
  try {
    const { courseId } = req.body;
    const result = await Enrollment.findOneAndDelete({ user: req.userId, course: courseId });
    if (!result) return res.status(404).json({ error: '未找到选课记录' });
    res.json({ message: '退课成功' });
  } catch {
    res.status(500).json({ error: '退课失败' });
  }
});

export default router;

import { Router } from 'express';
import Course from '../models/Course';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q ? { name: { $regex: q as string, $options: 'i' } } : {};
    const courses = await Course.find(filter).populate('teacher').sort({ dayOfWeek: 1, startTime: 1 });
    res.json(courses);
  } catch {
    res.status(500).json({ error: '获取课程列表失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('teacher');
    if (!course) return res.status(404).json({ error: '课程不存在' });
    const sameNameCourses = await Course.find({ name: course.name })
      .populate('teacher')
      .sort({ dayOfWeek: 1, startTime: 1 });

    const offerings = sameNameCourses.map((c: any) => ({
      _id: c._id,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      teacher: c.teacher,
    }));

    res.json({
      ...course.toObject(),
      offerings,
    });
  } catch {
    res.status(500).json({ error: '获取课程详情失败' });
  }
});

export default router;

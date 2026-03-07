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
    res.json(course);
  } catch {
    res.status(500).json({ error: '获取课程详情失败' });
  }
});

export default router;

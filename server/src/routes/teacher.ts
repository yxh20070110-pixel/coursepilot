import { Router } from 'express';
import Teacher from '../models/Teacher';
import Review from '../models/Review';
import Course from '../models/Course';
import Like from '../models/Like';
import { auth } from '../middleware/auth';

const router = Router();

async function withLikeCount(teachers: any[], userId?: string) {
  return Promise.all(
    teachers.map(async (t) => {
      const likeCount = await Like.countDocuments({ teacher: t._id });
      let liked = false;
      if (userId) {
        liked = !!(await Like.findOne({ user: userId, teacher: t._id }));
      }
      return { ...t.toObject(), likeCount, liked };
    }),
  );
}

router.get('/', async (req, res) => {
  try {
    const { q, sort } = req.query;
    const filter = q ? { name: { $regex: q as string, $options: 'i' } } : {};
    let teachers = await Teacher.find(filter);

    const [reviewCounts, courseCounts, likeCounts] = await Promise.all([
      Promise.all(teachers.map((t) => Review.countDocuments({ teacher: t._id }))),
      Promise.all(teachers.map((t) => Course.countDocuments({ teacher: t._id }))),
      Promise.all(teachers.map((t) => Like.countDocuments({ teacher: t._id }))),
    ]);

    const result = teachers.map((t, i) => ({
      ...t.toObject(),
      reviewCount: reviewCounts[i],
      courseCount: courseCounts[i],
      likeCount: likeCounts[i],
      liked: false,
    }));

    if (sort === 'popular') {
      result.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    }

    res.json(result);
  } catch {
    res.status(500).json({ error: '获取教师列表失败' });
  }
});

router.get('/popular', async (req, res) => {
  try {
    const teachers = await Teacher.find();
    const withCounts = await Promise.all(
      teachers.map(async (t) => {
        const [reviewCount, courseCount, likeCount] = await Promise.all([
          Review.countDocuments({ teacher: t._id }),
          Course.countDocuments({ teacher: t._id }),
          Like.countDocuments({ teacher: t._id }),
        ]);
        return { ...t.toObject(), reviewCount, courseCount, likeCount };
      }),
    );
    withCounts.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
    res.json(withCounts.slice(0, 10));
  } catch {
    res.status(500).json({ error: '获取热门教师失败' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const teacherId = req.params.id;
    const userId = req.userId!;
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ error: '教师不存在' });

    const existing = await Like.findOne({ user: userId, teacher: teacherId });
    if (existing) {
      await Like.findByIdAndDelete(existing._id);
      const count = await Like.countDocuments({ teacher: teacherId });
      return res.json({ liked: false, likeCount: count });
    }
    await Like.create({ user: userId, teacher: teacherId });
    const count = await Like.countDocuments({ teacher: teacherId });
    res.json({ liked: true, likeCount: count });
  } catch {
    res.status(500).json({ error: '操作失败' });
  }
});

router.get('/:id/liked', auth, async (req, res) => {
  try {
    const liked = await Like.findOne({ user: req.userId, teacher: req.params.id });
    res.json({ liked: !!liked });
  } catch {
    res.status(500).json({ error: '获取失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: '教师不存在' });

    const [courses, reviews, likeCount] = await Promise.all([
      Course.find({ teacher: teacher._id }),
      Review.find({ teacher: teacher._id }),
      Like.countDocuments({ teacher: teacher._id }),
    ]);

    const avgScores = { teachingQuality: 0, workload: 0, gradingFairness: 0, difficulty: 0 };
    if (reviews.length > 0) {
      avgScores.teachingQuality = reviews.reduce((s, r) => s + r.teachingQuality, 0) / reviews.length;
      avgScores.workload = reviews.reduce((s, r) => s + r.workload, 0) / reviews.length;
      avgScores.gradingFairness = reviews.reduce((s, r) => s + r.gradingFairness, 0) / reviews.length;
      avgScores.difficulty = reviews.reduce((s, r) => s + r.difficulty, 0) / reviews.length;
    }

    let liked = false;
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'course-helper-jwt-secret-2024') as any;
        liked = !!(await Like.findOne({ user: decoded.userId, teacher: teacher._id }));
      } catch {}
    }

    res.json({
      ...teacher.toObject(),
      courses,
      avgScores,
      reviewCount: reviews.length,
      likeCount,
      liked,
    });
  } catch {
    res.status(500).json({ error: '获取教师详情失败' });
  }
});

export default router;

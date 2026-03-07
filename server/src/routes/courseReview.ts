import { Router } from 'express';
import CourseReview from '../models/CourseReview';
import Course from '../models/Course';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/course/:courseId', async (req, res) => {
  try {
    const reviews = await CourseReview.find({ course: req.params.courseId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const ratingAvg = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const formatted = reviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      content: r.content,
      isAnonymous: r.isAnonymous,
      userName: r.isAnonymous ? '匿名用户' : (r.user as any)?.name || '未知用户',
      createdAt: r.createdAt,
    }));

    res.json({
      ratingAvg,
      reviewCount: reviews.length,
      reviews: formatted,
    });
  } catch {
    res.status(500).json({ error: '获取课程评价失败' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { courseId, rating, content, isAnonymous } = req.body;
    if (!courseId || !content?.trim()) {
      return res.status(400).json({ error: '请填写完整评价内容' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: '评分必须在 1-5 之间' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: '课程不存在' });

    const existing = await CourseReview.findOne({ user: req.userId, course: courseId });
    if (existing) {
      return res.status(400).json({ error: '您已评价过该课程' });
    }

    const review = await CourseReview.create({
      user: req.userId,
      course: courseId,
      rating,
      content: content.trim(),
      isAnonymous: !!isAnonymous,
    });

    res.json(review);
  } catch {
    res.status(500).json({ error: '提交课程评价失败' });
  }
});

export default router;

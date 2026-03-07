import { Router } from 'express';
import Review from '../models/Review';
import { auth } from '../middleware/auth';

const router = Router();

router.post('/', auth, async (req, res) => {
  try {
    const { teacherId, teachingQuality, workload, gradingFairness, difficulty } = req.body;

    const scores = [teachingQuality, workload, gradingFairness, difficulty];
    if (scores.some((s) => !s || s < 1 || s > 5)) {
      return res.status(400).json({ error: '评分必须在 1-5 之间' });
    }

    const existing = await Review.findOne({ user: req.userId, teacher: teacherId });
    if (existing) return res.status(400).json({ error: '您已经评价过该教师' });

    const review = await Review.create({
      user: req.userId,
      teacher: teacherId,
      teachingQuality, workload, gradingFairness, difficulty,
    });
    res.json(review);
  } catch {
    res.status(500).json({ error: '提交评分失败' });
  }
});

export default router;

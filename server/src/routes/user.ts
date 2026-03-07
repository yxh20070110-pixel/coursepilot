import { Router } from 'express';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/credit-progress', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const enrollments = await Enrollment.find({ user: req.userId }).populate('course');
    const earnedCredits = enrollments.reduce((sum, e) => sum + (e.course as any).credits, 0);
    const requiredCredits = user.totalCreditsRequired;
    const percentage = requiredCredits > 0 ? Math.round((earnedCredits / requiredCredits) * 1000) / 10 : 0;

    res.json({ earnedCredits, requiredCredits, percentage });
  } catch {
    res.status(500).json({ error: '获取学分进度失败' });
  }
});

router.get('/enrollments', auth, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.userId })
      .populate({ path: 'course', populate: { path: 'teacher' } });
    res.json(enrollments);
  } catch {
    res.status(500).json({ error: '获取选课记录失败' });
  }
});

export default router;

import { Router } from 'express';
import User from '../models/User';
import Enrollment from '../models/Enrollment';
import TrainingPlan from '../models/TrainingPlan';
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

router.put('/profile', auth, async (req, res) => {
  try {
    const major = String(req.body?.major || '').trim();
    const grade = Number(req.body?.grade || 0);
    if (!major) return res.status(400).json({ error: '专业不能为空' });
    if (!grade || grade < 2000) return res.status(400).json({ error: '年级不合法' });

    const user = await User.findByIdAndUpdate(
      req.userId,
      { major, grade },
      { new: true },
    ).select('-password');
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch {
    res.status(500).json({ error: '更新个人信息失败' });
  }
});

router.get('/training-plan', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: '用户不存在' });
    if (!user.major || !user.grade) {
      return res.json({
        major: user.major || '',
        grade: user.grade || null,
        semester: null,
        availableSemesters: [],
        items: [],
      });
    }

    const allPlans = await TrainingPlan.find({ major: user.major, grade: user.grade }).sort({ semester: 1 });
    const availableSemesters = allPlans.map((p) => p.semester);
    const targetSemester = Number(req.query.semester || 0) || (availableSemesters[availableSemesters.length - 1] || null);
    const plan = targetSemester
      ? allPlans.find((p) => p.semester === targetSemester) || null
      : null;

    const enrollments = await Enrollment.find({ user: req.userId }).populate('course');
    const selectedCourseIds = new Set(
      enrollments.map((e: any) => String(e.course?._id || '')),
    );
    const selectedCourseNames = new Set(
      enrollments.map((e: any) => String(e.course?.name || '').trim()).filter(Boolean),
    );

    const items = (plan?.items || []).map((item: any) => {
      const byId = item.courseId ? selectedCourseIds.has(String(item.courseId)) : false;
      const byName = selectedCourseNames.has(String(item.courseName || '').trim());
      return {
        ...item.toObject(),
        satisfied: byId || byName,
      };
    });

    res.json({
      major: user.major,
      grade: user.grade,
      semester: targetSemester,
      availableSemesters,
      items,
    });
  } catch {
    res.status(500).json({ error: '获取培养计划失败' });
  }
});

export default router;

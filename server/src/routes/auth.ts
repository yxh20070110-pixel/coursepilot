import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { auth } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'course-helper-jwt-secret-2024';

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, major, grade } = req.body;
    const studentId = String(email || '').trim();
    if (!name || !studentId || !password) return res.status(400).json({ error: '请填写完整信息' });
    if (password.length < 6) return res.status(400).json({ error: '密码至少6位' });
    if (!/^\d{10}$/.test(studentId)) return res.status(400).json({ error: '学号必须为10位数字' });

    const existing = await User.findOne({ email: studentId });
    if (existing) return res.status(400).json({ error: '该学号已注册' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: studentId,
      password: hashed,
      major: major || '',
      grade: Number(grade || new Date().getFullYear()),
    });

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalCreditsRequired: user.totalCreditsRequired,
        major: user.major,
        grade: user.grade,
      },
    });
  } catch {
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const studentId = String(email || '').trim();
    if (!/^\d{10}$/.test(studentId)) return res.status(400).json({ error: '学号或密码错误' });

    const user = await User.findOne({ email: studentId });
    if (!user) return res.status(400).json({ error: '学号或密码错误' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: '学号或密码错误' });

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalCreditsRequired: user.totalCreditsRequired,
        major: user.major,
        grade: user.grade,
      },
    });
  } catch {
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json(user);
  } catch {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export default router;

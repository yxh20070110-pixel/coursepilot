import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Photo from '../models/Photo';
import Teacher from '../models/Teacher';
import Course from '../models/Course';
import { auth, adminAuth } from '../middleware/auth';

const router = Router();

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('仅支持图片文件'));
  },
});

router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const photos = await Photo.find({ teacher: req.params.teacherId, status: 'approved' })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json(photos.map((p) => ({
      id: p._id,
      imageUrl: p.imageUrl,
      caption: p.caption || '',
      userName: (p.user as any)?.name || '未知用户',
      createdAt: p.createdAt,
    })));
  } catch {
    res.status(500).json({ error: '获取教师照片墙失败' });
  }
});

router.get('/course/:courseId', async (req, res) => {
  try {
    const photos = await Photo.find({ course: req.params.courseId, status: 'approved' })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json(photos.map((p) => ({
      id: p._id,
      imageUrl: p.imageUrl,
      caption: p.caption || '',
      userName: (p.user as any)?.name || '未知用户',
      createdAt: p.createdAt,
    })));
  } catch {
    res.status(500).json({ error: '获取课程照片墙失败' });
  }
});

router.post('/teacher/:teacherId', auth, upload.single('image'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId);
    if (!teacher) return res.status(404).json({ error: '教师不存在' });
    if (!req.file) return res.status(400).json({ error: '请上传图片' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const photo = await Photo.create({
      user: req.userId,
      teacher: req.params.teacherId,
      imageUrl,
      caption: req.body.caption || '',
      status: 'approved',
    });
    res.json(photo);
  } catch {
    res.status(500).json({ error: '上传教师照片失败' });
  }
});

router.post('/course/:courseId', auth, upload.single('image'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: '课程不存在' });
    if (!req.file) return res.status(400).json({ error: '请上传图片' });

    const imageUrl = `/uploads/${req.file.filename}`;
    const photo = await Photo.create({
      user: req.userId,
      course: req.params.courseId,
      imageUrl,
      caption: req.body.caption || '',
      status: 'pending',
    });
    res.json({ message: '上传成功，等待管理员审核', photo });
  } catch {
    res.status(500).json({ error: '上传课程照片失败' });
  }
});

router.get('/admin/pending', adminAuth, async (_req, res) => {
  try {
    const photos = await Photo.find({ course: { $exists: true, $ne: null }, status: 'pending' })
      .populate('user', 'name email')
      .populate('course', 'name')
      .sort({ createdAt: -1 });
    res.json(photos.map((p: any) => ({
      id: p._id,
      imageUrl: p.imageUrl,
      caption: p.caption || '',
      createdAt: p.createdAt,
      userName: p.user?.name || '未知用户',
      userStudentId: p.user?.email || '',
      courseName: p.course?.name || '未知课程',
    })));
  } catch {
    res.status(500).json({ error: '获取待审核照片失败' });
  }
});

router.put('/admin/:photoId/review', adminAuth, async (req, res) => {
  try {
    const action = String(req.body?.action || '');
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action 必须是 approve 或 reject' });
    }
    const status = action === 'approve' ? 'approved' : 'rejected';
    const photo = await Photo.findByIdAndUpdate(
      req.params.photoId,
      {
        status,
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        reviewNote: String(req.body?.reviewNote || ''),
      },
      { new: true },
    );
    if (!photo) return res.status(404).json({ error: '照片不存在' });
    res.json({ message: status === 'approved' ? '审核通过' : '已驳回' });
  } catch {
    res.status(500).json({ error: '审核操作失败' });
  }
});

export default router;

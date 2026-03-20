import { Router } from 'express';
import Comment from '../models/Comment';
import { auth, adminAuth } from '../middleware/auth';

const router = Router();

router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const comments = await Comment.find({ teacher: req.params.teacherId, status: 'approved' })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    const formatted = comments.map((c) => ({
      id: c._id,
      content: c.content,
      isAnonymous: c.isAnonymous,
      userName: c.isAnonymous ? '匿名用户' : (c.user as any)?.name || '未知用户',
      createdAt: c.createdAt,
    }));
    res.json(formatted);
  } catch {
    res.status(500).json({ error: '获取评论失败' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { teacherId, content, isAnonymous } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: '评论内容不能为空' });

    const comment = await Comment.create({
      user: req.userId,
      teacher: teacherId,
      content: content.trim(),
      isAnonymous: !!isAnonymous,
      status: 'pending',
    });
    res.json({ message: '评论提交成功，待管理员审核', comment });
  } catch {
    res.status(500).json({ error: '发表评论失败' });
  }
});

router.get('/admin/pending', adminAuth, async (_req, res) => {
  try {
    const comments = await Comment.find({ status: 'pending' })
      .populate('user', 'name email')
      .populate('teacher', 'name')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch {
    res.status(500).json({ error: '获取待审核教师评论失败' });
  }
});

router.put('/admin/:id/review', adminAuth, async (req, res) => {
  try {
    const action = String(req.body?.action || '');
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action 必须是 approve 或 reject' });
    }
    const status = action === 'approve' ? 'approved' : 'rejected';
    const updated = await Comment.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        reviewNote: String(req.body?.reviewNote || ''),
      },
      { new: true },
    );
    if (!updated) return res.status(404).json({ error: '评论不存在' });
    res.json({ message: status === 'approved' ? '审核通过' : '已驳回' });
  } catch {
    res.status(500).json({ error: '审核失败' });
  }
});

export default router;

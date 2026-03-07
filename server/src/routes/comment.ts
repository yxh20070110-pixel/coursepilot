import { Router } from 'express';
import Comment from '../models/Comment';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const comments = await Comment.find({ teacher: req.params.teacherId })
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
    });
    res.json(comment);
  } catch {
    res.status(500).json({ error: '发表评论失败' });
  }
});

export default router;

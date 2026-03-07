import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import Teacher from '../models/Teacher';
import Course from '../models/Course';
import Comment from '../models/Comment';
import User from '../models/User';
import { adminAuth } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function parseTags(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(String).map((s) => s.trim()).filter(Boolean);
  return String(input).split(/[,，、]/).map((s) => s.trim()).filter(Boolean);
}

function normalizeTime(input: unknown, fallback: string) {
  if (!input) return fallback;
  const raw = String(input).trim();
  const m = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) return fallback;
  const hh = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  return `${hh}:${mm}`;
}

router.get('/teachers', adminAuth, async (_req, res) => {
  try { res.json(await Teacher.find().sort({ createdAt: -1 })); }
  catch { res.status(500).json({ error: '获取失败' }); }
});

router.post('/teachers', adminAuth, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      tags: parseTags(req.body.tags),
      researchArea: req.body.researchArea || '',
    };
    res.json(await Teacher.create(payload));
  }
  catch { res.status(500).json({ error: '添加失败' }); }
});

router.put('/teachers/:id', adminAuth, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      tags: parseTags(req.body.tags),
      researchArea: req.body.researchArea || '',
    };
    const t = await Teacher.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!t) return res.status(404).json({ error: '教师不存在' });
    res.json(t);
  } catch { res.status(500).json({ error: '更新失败' }); }
});

router.delete('/teachers/:id', adminAuth, async (req, res) => {
  try { await Teacher.findByIdAndDelete(req.params.id); res.json({ message: '删除成功' }); }
  catch { res.status(500).json({ error: '删除失败' }); }
});

router.get('/courses', adminAuth, async (_req, res) => {
  try { res.json(await Course.find().populate('teacher').sort({ createdAt: -1 })); }
  catch { res.status(500).json({ error: '获取失败' }); }
});

router.post('/courses', adminAuth, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      courseCode: req.body.courseCode || '',
      classroom: req.body.classroom || '',
      weeks: req.body.weeks || '',
      capacity: Number(req.body.capacity || 0),
    };
    const c = await Course.create(payload);
    res.json(await c.populate('teacher'));
  } catch { res.status(500).json({ error: '添加失败' }); }
});

router.put('/courses/:id', adminAuth, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      courseCode: req.body.courseCode || '',
      classroom: req.body.classroom || '',
      weeks: req.body.weeks || '',
      capacity: Number(req.body.capacity || 0),
    };
    const c = await Course.findByIdAndUpdate(req.params.id, payload, { new: true }).populate('teacher');
    if (!c) return res.status(404).json({ error: '课程不存在' });
    res.json(c);
  } catch { res.status(500).json({ error: '更新失败' }); }
});

router.delete('/courses/:id', adminAuth, async (req, res) => {
  try { await Course.findByIdAndDelete(req.params.id); res.json({ message: '删除成功' }); }
  catch { res.status(500).json({ error: '删除失败' }); }
});

router.get('/comments', adminAuth, async (_req, res) => {
  try {
    res.json(await Comment.find().populate('user', 'name email').populate('teacher', 'name').sort({ createdAt: -1 }));
  } catch { res.status(500).json({ error: '获取失败' }); }
});

router.delete('/comments/:id', adminAuth, async (req, res) => {
  try { await Comment.findByIdAndDelete(req.params.id); res.json({ message: '删除成功' }); }
  catch { res.status(500).json({ error: '删除失败' }); }
});

router.get('/users', adminAuth, async (_req, res) => {
  try { res.json(await User.find().select('-password').sort({ createdAt: -1 })); }
  catch { res.status(500).json({ error: '获取失败' }); }
});

router.post('/teachers/batch', adminAuth, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: 'items 不能为空' });
    const created = await Teacher.insertMany(items.map((t: any) => ({
      name: t.name || '',
      title: t.title || '',
      department: t.department || '',
      researchArea: t.researchArea || '',
      tags: parseTags(t.tags),
    })));
    res.json({ count: created.length, items: created });
  } catch {
    res.status(500).json({ error: '批量添加教师失败' });
  }
});

router.post('/courses/batch', adminAuth, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: 'items 不能为空' });
    const created = await Course.insertMany(items.map((c: any) => ({
      name: c.name || '',
      credits: Number(c.credits || 0),
      dayOfWeek: Number(c.dayOfWeek || 1),
      startTime: normalizeTime(c.startTime, '08:00'),
      endTime: normalizeTime(c.endTime, '09:40'),
      teacher: c.teacher,
      courseCode: c.courseCode || '',
      classroom: c.classroom || '',
      weeks: c.weeks || '',
      capacity: Number(c.capacity || 0),
    })));
    res.json({ count: created.length, items: created });
  } catch {
    res.status(500).json({ error: '批量添加课程失败' });
  }
});

router.post('/import/courses', adminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请上传 Excel 文件' });
    const dryRun = String(req.query.preview || req.body.preview || '').toLowerCase() === 'true';

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

    const preview: any[] = [];
    const errors: any[] = [];
    const warnings: any[] = [];
    let createdCourses = 0;
    let createdTeachers = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowNo = i + 2;
      const courseName = String(row.courseName || row.name || '').trim();
      const teacherName = String(row.teacherName || row.teacher || '').trim();
      const credits = Number(row.credits || 0);
      const dayOfWeek = Number(row.dayOfWeek || 0);
      const startTime = normalizeTime(row.startTime, '');
      const endTime = normalizeTime(row.endTime, '');
      const department = String(row.department || '').trim();
      const title = String(row.title || '').trim();
      const classroom = String(row.classroom || '').trim();
      const weeks = String(row.weeks || '').trim();
      const courseCode = String(row.courseCode || '').trim();
      const capacity = Number(row.capacity || 0);

      if (!courseName || !teacherName || !credits || !dayOfWeek || !startTime || !endTime) {
        errors.push({ row: rowNo, error: '缺少必填字段(courseName/teacherName/credits/dayOfWeek/startTime/endTime)' });
        continue;
      }
      if (dayOfWeek < 1 || dayOfWeek > 7) {
        errors.push({ row: rowNo, error: 'dayOfWeek 必须在 1-7 之间' });
        continue;
      }

      preview.push({ row: rowNo, courseName, teacherName, credits, dayOfWeek, startTime, endTime, department, classroom });

      if (dryRun) continue;

      let teacher = await Teacher.findOne({ name: teacherName, department });
      if (!teacher) {
        teacher = await Teacher.create({
          name: teacherName,
          title,
          department,
          tags: [],
          researchArea: '',
        });
        createdTeachers += 1;
      }

      const duplicate = await Course.findOne({
        name: courseName,
        teacher: teacher._id,
        dayOfWeek,
        startTime,
        endTime,
      });
      if (duplicate) {
        warnings.push({ row: rowNo, warning: '重复课程已跳过', courseName, teacherName });
        continue;
      }

      await Course.create({
        name: courseName,
        credits,
        dayOfWeek,
        startTime,
        endTime,
        teacher: teacher._id,
        courseCode,
        classroom,
        weeks,
        capacity: Number.isFinite(capacity) ? capacity : 0,
      });
      createdCourses += 1;
    }

    res.json({
      mode: dryRun ? 'preview' : 'import',
      totalRows: rows.length,
      preview: preview.slice(0, 50),
      errors,
      warnings,
      createdCourses,
      createdTeachers,
    });
  } catch {
    res.status(500).json({ error: '导入失败，请检查 Excel 格式' });
  }
});

export default router;

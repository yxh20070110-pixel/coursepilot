import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import Teacher from '../models/Teacher';
import Course from '../models/Course';
import Comment from '../models/Comment';
import User from '../models/User';
import TrainingPlan from '../models/TrainingPlan';
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

function parseScheduleSlots(input: unknown, fallback?: { dayOfWeek: number; startTime: string; endTime: string }) {
  if (!Array.isArray(input)) {
    return fallback ? [fallback] : [];
  }
  const slots = input
    .map((slot: any) => ({
      dayOfWeek: Number(slot?.dayOfWeek || 0),
      startTime: normalizeTime(slot?.startTime, ''),
      endTime: normalizeTime(slot?.endTime, ''),
    }))
    .filter((slot) => slot.dayOfWeek >= 1 && slot.dayOfWeek <= 7 && slot.startTime && slot.endTime);
  if (slots.length > 0) return slots;
  return fallback ? [fallback] : [];
}

function normalizeCourseId(input: any) {
  if (!input) return undefined;
  if (typeof input === 'string') return input;
  if (typeof input === 'object' && input._id) return String(input._id);
  return undefined;
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
    const fallback = {
      dayOfWeek: Number(req.body.dayOfWeek || 1),
      startTime: normalizeTime(req.body.startTime, '08:00'),
      endTime: normalizeTime(req.body.endTime, '09:40'),
    };
    const scheduleSlots = parseScheduleSlots(req.body.scheduleSlots, fallback);
    const payload = {
      ...req.body,
      dayOfWeek: scheduleSlots[0].dayOfWeek,
      startTime: scheduleSlots[0].startTime,
      endTime: scheduleSlots[0].endTime,
      scheduleSlots,
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
    const fallback = {
      dayOfWeek: Number(req.body.dayOfWeek || 1),
      startTime: normalizeTime(req.body.startTime, '08:00'),
      endTime: normalizeTime(req.body.endTime, '09:40'),
    };
    const scheduleSlots = parseScheduleSlots(req.body.scheduleSlots, fallback);
    const payload = {
      ...req.body,
      dayOfWeek: scheduleSlots[0].dayOfWeek,
      startTime: scheduleSlots[0].startTime,
      endTime: scheduleSlots[0].endTime,
      scheduleSlots,
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
      scheduleSlots: parseScheduleSlots(c.scheduleSlots, {
        dayOfWeek: Number(c.dayOfWeek || 1),
        startTime: normalizeTime(c.startTime, '08:00'),
        endTime: normalizeTime(c.endTime, '09:40'),
      }),
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

      const sameCourse = await Course.findOne({
        name: courseName,
        teacher: teacher._id,
      });

      if (sameCourse) {
        const existedSlots = Array.isArray((sameCourse as any).scheduleSlots) ? (sameCourse as any).scheduleSlots : [];
        const duplicatedSlot = existedSlots.some((s: any) => (
          s.dayOfWeek === dayOfWeek && s.startTime === startTime && s.endTime === endTime
        ));
        if (duplicatedSlot) {
          warnings.push({ row: rowNo, warning: '重复课程时段已跳过', courseName, teacherName });
          continue;
        }
        sameCourse.scheduleSlots = [...existedSlots, { dayOfWeek, startTime, endTime }];
        sameCourse.dayOfWeek = dayOfWeek;
        sameCourse.startTime = startTime;
        sameCourse.endTime = endTime;
        await sameCourse.save();
        createdCourses += 1;
        continue;
      }

      await Course.create({
        name: courseName,
        credits,
        dayOfWeek,
        startTime,
        endTime,
        scheduleSlots: [{ dayOfWeek, startTime, endTime }],
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

router.get('/training-plans', adminAuth, async (_req, res) => {
  try {
    const plans = await TrainingPlan.find()
      .populate('items.courseId', 'name')
      .sort({ major: 1, grade: 1, semester: 1 });
    res.json(plans);
  } catch {
    res.status(500).json({ error: '获取培养计划失败' });
  }
});

router.post('/training-plans', adminAuth, async (req, res) => {
  try {
    const major = String(req.body?.major || '').trim();
    const grade = Number(req.body?.grade || 0);
    const semester = Number(req.body?.semester || 0);
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!major || !grade || !semester) {
      return res.status(400).json({ error: 'major/grade/semester 必填' });
    }
    const items = rawItems
      .map((item: any) => ({
        courseName: String(item?.courseName || '').trim(),
        courseId: normalizeCourseId(item?.courseId),
        required: item?.required !== false,
      }))
      .filter((item: any) => !!item.courseName);

    const plan = await TrainingPlan.create({ major, grade, semester, items });
    res.json(await plan.populate('items.courseId', 'name'));
  } catch {
    res.status(500).json({ error: '新增培养计划失败' });
  }
});

router.put('/training-plans/:id', adminAuth, async (req, res) => {
  try {
    const major = String(req.body?.major || '').trim();
    const grade = Number(req.body?.grade || 0);
    const semester = Number(req.body?.semester || 0);
    const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!major || !grade || !semester) {
      return res.status(400).json({ error: 'major/grade/semester 必填' });
    }
    const items = rawItems
      .map((item: any) => ({
        courseName: String(item?.courseName || '').trim(),
        courseId: normalizeCourseId(item?.courseId),
        required: item?.required !== false,
      }))
      .filter((item: any) => !!item.courseName);

    const plan = await TrainingPlan.findByIdAndUpdate(
      req.params.id,
      { major, grade, semester, items },
      { new: true },
    ).populate('items.courseId', 'name');
    if (!plan) return res.status(404).json({ error: '培养计划不存在' });
    res.json(plan);
  } catch {
    res.status(500).json({ error: '更新培养计划失败' });
  }
});

router.delete('/training-plans/:id', adminAuth, async (req, res) => {
  try {
    await TrainingPlan.findByIdAndDelete(req.params.id);
    res.json({ message: '删除成功' });
  } catch {
    res.status(500).json({ error: '删除培养计划失败' });
  }
});

export default router;

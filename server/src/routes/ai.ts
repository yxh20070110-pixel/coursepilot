import { Router } from 'express';
import { auth } from '../middleware/auth';
import Course from '../models/Course';
import Teacher from '../models/Teacher';
import Enrollment from '../models/Enrollment';
import Review from '../models/Review';
import Comment from '../models/Comment';
import Like from '../models/Like';
import CourseReview from '../models/CourseReview';
import { providerHint } from '../services/aiProvider';

const router = Router();

const TRAIT_RULES = [
  { label: '讲解清晰', keywords: ['清晰', '条理', '讲得好', '易懂', '板书'] },
  { label: '互动友好', keywords: ['互动', '耐心', '答疑', '友好', '氛围'] },
  { label: '实践导向', keywords: ['实践', '项目', '实战', '案例', '应用'] },
  { label: '前沿深入', keywords: ['前沿', '深入', '硬核', '干货', '挑战'] },
  { label: '给分友好', keywords: ['给分', '公平', '好过', '不压分'] },
  { label: '作业较多', keywords: ['作业多', '任务重', '压力大', '负担'] },
];

const SUBJECT_HINTS = ['人工智能', 'ai', '计算机', '数学', '英语', '经济', '管理', '电子', '软件', '网络', '数据库'];
const COURSE_TRAIT_RULES = [
  { label: '内容扎实', keywords: ['扎实', '系统', '干货', '全面'] },
  { label: '实践性强', keywords: ['实践', '项目', '实战', '案例'] },
  { label: '难度偏高', keywords: ['难', '硬核', '挑战', '吃力'] },
  { label: '节奏友好', keywords: ['易懂', '清晰', '循序渐进', '友好'] },
];

type TeacherProfile = {
  teacher: any;
  reviewCount: number;
  commentCount: number;
  likeCount: number;
  avgTeach: number;
  avgWorkload: number;
  avgFairness: number;
  avgDifficulty: number;
  topTraits: string[];
  corpus: string;
  comments: string[];
};

type CourseProfile = {
  course: any;
  reviewCount: number;
  avgRating: number;
  topTraits: string[];
  comments: string[];
  corpus: string;
};

type AIJumpLink = {
  label: string;
  href: string;
};

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

function toFixed1(n: number) {
  return n ? n.toFixed(1) : '暂无';
}

function shortText(s: string, max = 30) {
  if (!s) return '';
  return s.length <= max ? s : `${s.slice(0, max)}...`;
}

function countHits(text: string, keywords: string[]) {
  return keywords.reduce((sum, kw) => sum + (text.includes(kw) ? 1 : 0), 0);
}

async function getTeacherProfiles(): Promise<TeacherProfile[]> {
  const [teachers, reviews, comments, courses, likes] = await Promise.all([
    Teacher.find(),
    Review.find(),
    Comment.find(),
    Course.find(),
    Like.find(),
  ]);

  return teachers.map((teacher: any) => {
    const teacherId = String(teacher._id);
    const teacherReviews = reviews.filter((r: any) => String(r.teacher) === teacherId);
    const teacherComments = comments.filter((c: any) => String(c.teacher) === teacherId);
    const teacherCourses = courses.filter((c: any) => String(c.teacher) === teacherId);
    const likeCount = likes.filter((l: any) => String(l.teacher) === teacherId).length;

    const avgTeach = avg(teacherReviews.map((r: any) => Number(r.teachingQuality) || 0));
    const avgWorkload = avg(teacherReviews.map((r: any) => Number(r.workload) || 0));
    const avgFairness = avg(teacherReviews.map((r: any) => Number(r.gradingFairness) || 0));
    const avgDifficulty = avg(teacherReviews.map((r: any) => Number(r.difficulty) || 0));

    const commentText = teacherComments.map((c: any) => String(c.content || '')).join(' ');
    const corpus = [
      teacher.name,
      teacher.title,
      teacher.department,
      teacher.researchArea,
      ...(Array.isArray(teacher.tags) ? teacher.tags : []),
      ...teacherCourses.map((c: any) => c.name),
      commentText,
    ].join(' ').toLowerCase();

    const topTraits = TRAIT_RULES
      .map((rule) => ({ label: rule.label, score: countHits(commentText, rule.keywords) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.label);

    return {
      teacher,
      reviewCount: teacherReviews.length,
      commentCount: teacherComments.length,
      likeCount,
      avgTeach,
      avgWorkload,
      avgFairness,
      avgDifficulty,
      topTraits,
      corpus,
      comments: teacherComments.map((c: any) => String(c.content || '')).filter(Boolean),
    };
  });
}

async function getCourseProfiles(): Promise<CourseProfile[]> {
  const [courses, courseReviews] = await Promise.all([
    Course.find().populate('teacher'),
    CourseReview.find(),
  ]);

  return courses.map((course: any) => {
    const courseId = String(course._id);
    const rel = courseReviews.filter((r: any) => String(r.course) === courseId);
    const comments = rel.map((r: any) => String(r.content || '')).filter(Boolean);
    const commentText = comments.join(' ');
    const avgRating = avg(rel.map((r: any) => Number(r.rating) || 0));
    const topTraits = COURSE_TRAIT_RULES
      .map((rule) => ({ label: rule.label, score: countHits(commentText, rule.keywords) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.label);

    const teacher: any = course.teacher || {};
    const corpus = [
      course.name,
      course.courseCode || '',
      teacher.name || '',
      teacher.department || '',
      commentText,
    ].join(' ').toLowerCase();

    return {
      course,
      reviewCount: rel.length,
      avgRating,
      topTraits,
      comments,
      corpus,
    };
  });
}

function findMentionedTeacher(question: string, profiles: TeacherProfile[]) {
  const q = question.toLowerCase();
  return profiles.find((p) => q.includes(String(p.teacher.name || '').toLowerCase()));
}

function findMentionedCourse(question: string, profiles: CourseProfile[]) {
  const q = question.toLowerCase();
  return profiles.find((p) => q.includes(String(p.course.name || '').toLowerCase()));
}

function extractWantedTraits(question: string) {
  const q = question.toLowerCase();
  return TRAIT_RULES.filter((r) => r.keywords.some((kw) => q.includes(kw))).map((r) => r.label);
}

function extractSubjectHints(question: string) {
  const q = question.toLowerCase();
  return SUBJECT_HINTS.filter((s) => q.includes(s));
}

function hasConflict(a: any, b: any) {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  return a.startTime < b.endTime && a.endTime > b.startTime;
}

router.post('/schedule', auth, async (req, res) => {
  try {
    const targetCredits = Number(req.body?.targetCredits || 18);
    const preferredDays = Array.isArray(req.body?.preferredDays) ? req.body.preferredDays.map(Number) : [];

    const [allCourses, enrollments] = await Promise.all([
      Course.find().populate('teacher'),
      Enrollment.find({ user: req.userId }).populate('course'),
    ]);

    const selected: any[] = [];
    const existing = enrollments.map((e: any) => e.course).filter(Boolean);
    let currentCredits = existing.reduce((sum: number, c: any) => sum + (c.credits || 0), 0);

    const candidates = allCourses
      .filter((c: any) => !existing.some((e: any) => String(e._id) === String(c._id)))
      .sort((a: any, b: any) => {
        const aPref = preferredDays.includes(a.dayOfWeek) ? 1 : 0;
        const bPref = preferredDays.includes(b.dayOfWeek) ? 1 : 0;
        if (aPref !== bPref) return bPref - aPref;
        return (b.credits || 0) - (a.credits || 0);
      });

    for (const course of candidates) {
      if (currentCredits >= targetCredits) break;
      const conflict = [...existing, ...selected].some((picked: any) => hasConflict(course, picked));
      if (conflict) continue;
      selected.push(course);
      currentCredits += course.credits || 0;
    }

    res.json({
      targetCredits,
      currentCredits,
      selectedCourses: selected.map((c: any) => ({
        _id: c._id,
        name: c.name,
        credits: c.credits,
        dayOfWeek: c.dayOfWeek,
        startTime: c.startTime,
        endTime: c.endTime,
        teacher: c.teacher,
      })),
      message: selected.length
        ? `已为你生成 ${selected.length} 门课程建议，当前总学分约 ${currentCredits}。`
        : '未找到满足条件的无冲突课程，请放宽条件后重试。',
      provider: providerHint(),
    });
  } catch {
    res.status(500).json({ error: 'AI 排课失败' });
  }
});

router.post('/recommend', auth, async (req, res) => {
  try {
    const interests = Array.isArray(req.body?.interests) ? req.body.interests.map((s: string) => s.toLowerCase()) : [];
    const preferEasy = !!req.body?.preferEasy;

    const [courses, teachers, reviews] = await Promise.all([
      Course.find().populate('teacher'),
      Teacher.find(),
      Review.find(),
    ]);

    const teacherDifficultyMap = new Map<string, number>();
    for (const t of teachers) {
      const rel = reviews.filter((r: any) => String(r.teacher) === String(t._id));
      const avg = rel.length ? rel.reduce((s: number, r: any) => s + r.difficulty, 0) / rel.length : 3;
      teacherDifficultyMap.set(String(t._id), avg);
    }

    const ranked = courses
      .map((c: any) => {
        const teacher: any = c.teacher || {};
        const text = `${c.name} ${teacher.name || ''} ${teacher.department || ''}`.toLowerCase();
        const hit = interests.reduce((acc: number, kw: string) => acc + (text.includes(kw) ? 1 : 0), 0);
        const difficulty = teacherDifficultyMap.get(String(teacher._id || c.teacher)) ?? 3;
        const easyScore = preferEasy ? (6 - difficulty) : difficulty;
        return { course: c, score: hit * 3 + easyScore };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.course);

    const teacherRank = teachers
      .map((t: any) => {
        const rel = reviews.filter((r: any) => String(r.teacher) === String(t._id));
        const avgTeach = rel.length ? rel.reduce((s: number, r: any) => s + r.teachingQuality, 0) / rel.length : 3;
        return { teacher: t, score: avgTeach };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.teacher);

    res.json({
      summary: '基于兴趣关键词、教师历史评分与难度偏好生成推荐（Mock AI）。',
      recommendedCourses: ranked,
      recommendedTeachers: teacherRank,
      provider: providerHint(),
    });
  } catch {
    res.status(500).json({ error: 'AI 推荐失败' });
  }
});

router.post('/chat', auth, async (req, res) => {
  try {
    const text = String(req.body?.message || '').trim();
    if (!text) return res.status(400).json({ error: '消息不能为空' });
    const q = text.toLowerCase();

    if (q.includes('冲突')) {
      return res.json({
        answer: '你可以在选课中心点击选课，系统会自动检测时间冲突。我也可以为你生成无冲突建议课表。',
        provider: providerHint(),
      });
    }
    if (q.includes('学分')) {
      return res.json({
        answer: '建议先设定本学期目标学分（如 16-22），再用 AI 排课功能生成无冲突组合。',
        provider: providerHint(),
      });
    }
    if (q.includes('excel') || q.includes('导入')) {
      return res.json({
        answer: '管理员可在后台的 Excel 导入页上传课表模板，系统会预览并提示错误后再导入。',
        provider: providerHint(),
      });
    }

    const courseProfiles = await getCourseProfiles();
    const mentionedCourse = findMentionedCourse(text, courseProfiles);
    if (mentionedCourse) {
      const teacher: any = mentionedCourse.course.teacher || {};
      const traitText = mentionedCourse.topTraits.length ? mentionedCourse.topTraits.join('、') : '暂无明显关键词';
      const examples = mentionedCourse.comments.slice(0, 2).map((c) => `- ${shortText(c)}`).join('\n');
      const links: AIJumpLink[] = [
        { label: `查看课程：${mentionedCourse.course.name}`, href: `/courses/${mentionedCourse.course._id}` },
      ];
      if (teacher?._id) {
        links.push({ label: `查看教师：${teacher.name || '授课教师'}`, href: `/teachers/${teacher._id}` });
      }
      const answer =
`关于课程「${mentionedCourse.course.name}」的同学反馈总结：
1) 课程评分（5分制）：${toFixed1(mentionedCourse.avgRating)}
2) 课程特点：${traitText}
3) 授课教师：${teacher.name || '暂未配置'}${teacher.department ? `（${teacher.department}）` : ''}
4) 数据来源：${mentionedCourse.reviewCount} 条课程评价
${examples ? `5) 代表性评价：\n${examples}` : '5) 该课程暂时还没有文字评价。'}`;

      return res.json({ answer, links, provider: providerHint() });
    }

    const profiles = await getTeacherProfiles();
    if (!profiles.length) {
      return res.json({
        answer: '当前还没有足够的老师评价数据。你可以先问课程（如“高等数学怎么样”），我会优先给你课程评价总结。',
        provider: providerHint(),
      });
    }

    const mentioned = findMentionedTeacher(text, profiles);
    if (mentioned) {
      const traitText = mentioned.topTraits.length ? mentioned.topTraits.join('、') : '暂无明显关键词';
      const examples = mentioned.comments.slice(0, 2).map((c) => `- ${shortText(c)}`).join('\n');
      const links: AIJumpLink[] = [
        { label: `查看教师：${mentioned.teacher.name}`, href: `/teachers/${mentioned.teacher._id}` },
      ];
      const answer =
`关于 ${mentioned.teacher.name} 的同学反馈总结：
1) 老师特点：${traitText}
2) 评分概况（5分制）：教学质量 ${toFixed1(mentioned.avgTeach)}，作业量 ${toFixed1(mentioned.avgWorkload)}，给分公平 ${toFixed1(mentioned.avgFairness)}，难度 ${toFixed1(mentioned.avgDifficulty)}
3) 数据来源：${mentioned.reviewCount} 条评分、${mentioned.commentCount} 条评论、${mentioned.likeCount} 个点赞
${examples ? `4) 代表性评论：\n${examples}` : '4) 暂无可展示评论样本。'}`;

      return res.json({ answer, links, provider: providerHint() });
    }

    const wantsRecommend = q.includes('推荐') || q.includes('适合') || q.includes('有没有') || q.includes('哪位');
    if (wantsRecommend) {
      const wantedTraits = extractWantedTraits(text);
      const subjectHints = extractSubjectHints(text);
      const preferEasy = ['轻松', '简单', '不难', '压力小', '给分友好'].some((k) => q.includes(k));
      const preferHard = ['硬核', '挑战', '高难度'].some((k) => q.includes(k));

      const ranked = profiles
        .map((p) => {
          const traitScore = wantedTraits.reduce((s, t) => s + (p.topTraits.includes(t) ? 3 : 0), 0);
          const subjectScore = subjectHints.reduce((s, h) => s + (p.corpus.includes(h) ? 2 : 0), 0);
          const qualityScore = p.avgTeach || 2.5;
          let difficultyScore = 0;
          if (preferEasy) difficultyScore = 6 - (p.avgDifficulty || 3);
          if (preferHard) difficultyScore = p.avgDifficulty || 3;
          return { profile: p, score: traitScore + subjectScore + qualityScore + difficultyScore };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      if (!ranked.length) {
        return res.json({
          answer: '暂时没有找到匹配条件的老师。你可以补充学科方向或期望特点（如“讲解清晰 / 作业少 / 给分友好”）。',
          provider: providerHint(),
        });
      }

      const lines = ranked.map(({ profile }, idx) => {
        const traits = profile.topTraits.length ? profile.topTraits.join('、') : '风格信息较少';
        const sample = profile.comments[0] ? `，评论示例：“${shortText(profile.comments[0], 24)}”` : '';
        return `${idx + 1}. ${profile.teacher.name}（${profile.teacher.department || '未知院系'}）- 特点：${traits}；教学质量 ${toFixed1(profile.avgTeach)}，难度 ${toFixed1(profile.avgDifficulty)}${sample}`;
      });

      const answer =
`根据你的提问，我基于同学评分与评论整理了以下老师：
${lines.join('\n')}

如果你愿意，我还可以按“更轻松 / 更硬核 / 给分更友好”继续细化推荐。`;

      const links: AIJumpLink[] = ranked.map(({ profile }) => ({
        label: `查看教师：${profile.teacher.name}`,
        href: `/teachers/${profile.teacher._id}`,
      }));

      return res.json({ answer, links, provider: providerHint() });
    }

    return res.json({
      answer: '我可以帮你分析老师和课程口碑。你可以直接问：\n- “刘教授怎么样？”\n- “高等数学怎么样？”\n- “推荐一个讲解清晰、给分友好的计算机老师”',
      provider: providerHint(),
    });
  } catch {
    res.status(500).json({ error: 'AI 聊天失败' });
  }
});

export default router;

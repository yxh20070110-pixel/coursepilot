import bcrypt from 'bcryptjs';
import User from './models/User';
import Teacher from './models/Teacher';
import Course from './models/Course';
import Review from './models/Review';
import Comment from './models/Comment';
import Enrollment from './models/Enrollment';
import Like from './models/Like';
import CourseReview from './models/CourseReview';
import Photo from './models/Photo';

export async function seedDemoData(options?: { clearFirst?: boolean }) {
  const clearFirst = !!options?.clearFirst;

  if (clearFirst) {
    await Promise.all([
      User.deleteMany({}), Teacher.deleteMany({}), Course.deleteMany({}),
      Review.deleteMany({}), Comment.deleteMany({}), Enrollment.deleteMany({}), Like.deleteMany({}),
      CourseReview.deleteMany({}), Photo.deleteMany({}),
    ]);
  }

  const pw = await bcrypt.hash('123456', 10);
  const adminPw = await bcrypt.hash('admin123', 10);

  const [admin, zs, ls, ww] = await User.create([
    { name: '管理员', email: 'admin@university.edu', password: adminPw, role: 'admin' },
    { name: '张三', email: 'zhangsan@university.edu', password: pw, totalCreditsRequired: 160 },
    { name: '李四', email: 'lisi@university.edu', password: pw, totalCreditsRequired: 160 },
    { name: '王五', email: 'wangwu@university.edu', password: pw, totalCreditsRequired: 155 },
  ]);

  const [liu, chen, wang, zhao, zhou, sun, gao, he] = await Teacher.create([
    { name: '刘教授', title: '教授', department: '数学系' },
    { name: '陈副教授', title: '副教授', department: '外语系' },
    { name: '王讲师', title: '讲师', department: '计算机系' },
    { name: '赵教授', title: '教授', department: '计算机系' },
    { name: '周副教授', title: '副教授', department: '软件工程系' },
    { name: '孙教授', title: '教授', department: '电子信息系' },
    { name: '高副教授', title: '副教授', department: '经济管理系' },
    { name: '何讲师', title: '讲师', department: '人工智能系' },
  ]);

  const courses = await Course.create([
    { name: '高等数学', credits: 5, dayOfWeek: 1, startTime: '08:00', endTime: '09:40', teacher: liu._id },
    { name: '线性代数', credits: 4, dayOfWeek: 2, startTime: '10:00', endTime: '11:40', teacher: liu._id },
    { name: '大学英语', credits: 3, dayOfWeek: 1, startTime: '10:00', endTime: '11:40', teacher: chen._id },
    { name: '程序设计', credits: 4, dayOfWeek: 3, startTime: '14:00', endTime: '15:40', teacher: wang._id },
    { name: '数据结构', credits: 4, dayOfWeek: 4, startTime: '08:00', endTime: '09:40', teacher: wang._id },
    { name: '计算机网络', credits: 3, dayOfWeek: 5, startTime: '10:00', endTime: '11:40', teacher: zhao._id },
    { name: '操作系统', credits: 4, dayOfWeek: 3, startTime: '08:00', endTime: '09:40', teacher: zhao._id },
    { name: '数据库原理', credits: 3, dayOfWeek: 2, startTime: '14:00', endTime: '15:40', teacher: zhou._id },
    { name: '软件工程', credits: 3, dayOfWeek: 4, startTime: '14:00', endTime: '15:40', teacher: zhou._id },
    { name: '人工智能导论', credits: 3, dayOfWeek: 5, startTime: '08:00', endTime: '09:40', teacher: chen._id },
    { name: '概率论', credits: 3, dayOfWeek: 1, startTime: '08:30', endTime: '10:10', teacher: zhao._id },
    { name: '数字电路', credits: 3, dayOfWeek: 2, startTime: '08:00', endTime: '09:40', teacher: sun._id },
    { name: '模拟电路', credits: 3, dayOfWeek: 4, startTime: '10:00', endTime: '11:40', teacher: sun._id },
    { name: '信号与系统', credits: 4, dayOfWeek: 3, startTime: '16:00', endTime: '17:40', teacher: sun._id },
    { name: '宏观经济学', credits: 3, dayOfWeek: 2, startTime: '16:00', endTime: '17:40', teacher: gao._id },
    { name: '管理学原理', credits: 2, dayOfWeek: 4, startTime: '16:00', endTime: '17:40', teacher: gao._id },
    { name: '机器学习基础', credits: 4, dayOfWeek: 5, startTime: '14:00', endTime: '15:40', teacher: he._id },
    { name: '深度学习导论', credits: 3, dayOfWeek: 6, startTime: '10:00', endTime: '11:40', teacher: he._id },
    { name: '计算机视觉', credits: 3, dayOfWeek: 6, startTime: '14:00', endTime: '15:40', teacher: he._id },
  ]);

  await Review.create([
    { user: zs._id, teacher: liu._id, teachingQuality: 5, workload: 3, gradingFairness: 4, difficulty: 4 },
    { user: ls._id, teacher: liu._id, teachingQuality: 4, workload: 4, gradingFairness: 5, difficulty: 3 },
    { user: ww._id, teacher: liu._id, teachingQuality: 4, workload: 3, gradingFairness: 4, difficulty: 5 },
    { user: zs._id, teacher: chen._id, teachingQuality: 3, workload: 2, gradingFairness: 4, difficulty: 2 },
    { user: ls._id, teacher: chen._id, teachingQuality: 4, workload: 3, gradingFairness: 3, difficulty: 3 },
    { user: ls._id, teacher: wang._id, teachingQuality: 4, workload: 3, gradingFairness: 3, difficulty: 4 },
    { user: ww._id, teacher: zhao._id, teachingQuality: 5, workload: 5, gradingFairness: 4, difficulty: 5 },
    { user: zs._id, teacher: zhao._id, teachingQuality: 4, workload: 4, gradingFairness: 5, difficulty: 4 },
    { user: zs._id, teacher: zhou._id, teachingQuality: 3, workload: 2, gradingFairness: 5, difficulty: 2 },
    { user: ls._id, teacher: sun._id, teachingQuality: 4, workload: 3, gradingFairness: 4, difficulty: 4 },
    { user: ww._id, teacher: gao._id, teachingQuality: 3, workload: 2, gradingFairness: 4, difficulty: 3 },
    { user: zs._id, teacher: he._id, teachingQuality: 5, workload: 4, gradingFairness: 4, difficulty: 4 },
  ]);

  await Comment.create([
    { user: zs._id, teacher: liu._id, content: '刘教授讲课非常清晰，板书工整，强烈推荐！', isAnonymous: false },
    { user: ls._id, teacher: liu._id, content: '数学课难度较大，但教授很有耐心，课后也愿意答疑。', isAnonymous: true },
    { user: ww._id, teacher: chen._id, content: '英语课氛围轻松，老师鼓励互动，作业量适中。', isAnonymous: false },
    { user: zs._id, teacher: wang._id, content: '编程课实战性强，不过需要花较多时间写作业。', isAnonymous: true },
    { user: ls._id, teacher: zhao._id, content: '赵教授的计算机课非常硬核，学到很多干货。', isAnonymous: false },
    { user: ww._id, teacher: zhou._id, content: '给分很好，课程内容实用，推荐选修。', isAnonymous: false },
    { user: zs._id, teacher: sun._id, content: '电子课条理清楚，实验讲解很细致。', isAnonymous: false },
    { user: ls._id, teacher: gao._id, content: '课堂案例很多，偏实务，适合经管同学。', isAnonymous: true },
    { user: ww._id, teacher: he._id, content: 'AI课内容前沿，推荐有基础后选。', isAnonymous: false },
  ]);

  await Enrollment.create([
    { user: zs._id, course: courses[0]._id },
    { user: zs._id, course: courses[3]._id },
    { user: zs._id, course: courses[5]._id },
    { user: ls._id, course: courses[1]._id },
    { user: ls._id, course: courses[4]._id },
    { user: ww._id, course: courses[11]._id },
    { user: ww._id, course: courses[16]._id },
    { user: zs._id, course: courses[14]._id },
  ]);

  await Like.create([
    { user: zs._id, teacher: liu._id }, { user: ls._id, teacher: liu._id }, { user: ww._id, teacher: liu._id },
    { user: zs._id, teacher: zhao._id }, { user: ls._id, teacher: zhao._id },
    { user: zs._id, teacher: chen._id }, { user: ww._id, teacher: chen._id },
    { user: zs._id, teacher: he._id }, { user: ls._id, teacher: he._id },
    { user: ww._id, teacher: sun._id }, { user: ls._id, teacher: gao._id },
  ]);

  await CourseReview.create([
    { user: zs._id, course: courses[0]._id, rating: 5, content: '内容扎实，老师讲解非常清楚，值得推荐。', isAnonymous: false },
    { user: ls._id, course: courses[0]._id, rating: 4, content: '课程有难度，但收获很大。', isAnonymous: true },
    { user: ww._id, course: courses[3]._id, rating: 5, content: '实践项目很多，提升很快。', isAnonymous: false },
    { user: zs._id, course: courses[7]._id, rating: 4, content: '数据库原理讲得系统，作业也有帮助。', isAnonymous: false },
  ]);
}

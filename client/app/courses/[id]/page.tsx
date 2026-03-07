'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';
import TeacherRatingBlock from '@/components/TeacherRatingBlock';
import CourseReviewBlock from '@/components/CourseReviewBlock';
import PhotoWall from '@/components/PhotoWall';

const DAY_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface Course {
  _id: string;
  name: string;
  credits: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacher: { _id: string; name: string; title: string; department?: string };
}

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/courses/${courseId}`)
      .then((r) => r.json())
      .then((d) => { setCourse(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [courseId]);

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" /></div>;
  if (!course) return <div className="text-center py-24 text-[#86868b]"><p>课程不存在</p><Link href="/courses" className="text-[#0071e3] hover:underline mt-2 inline-block">返回课程列表</Link></div>;

  return (
    <div className="max-w-[980px] mx-auto px-6 py-16">
      <div className="mb-12">
        <Link href="/courses" className="text-[15px] text-[#0071e3] hover:underline mb-6 inline-block">← 返回课程列表</Link>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">{course.name}</h1>
            <div className="mt-4 flex flex-wrap gap-4 text-[17px] text-[#86868b]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
                {course.credits} 学分
              </span>
              <span>{DAY_NAMES[course.dayOfWeek]} {course.startTime} - {course.endTime}</span>
            </div>
          </div>
          <Link href={`/teachers/${course.teacher._id}`} className="px-6 py-3 rounded-[980px] bg-[#0071e3] text-white text-[15px] font-medium hover:bg-[#0077ed] transition">
            查看授课教师
          </Link>
        </div>
      </div>

      <div className="bg-[#f5f5f7] rounded-3xl p-8 md:p-12">
        <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-8">授课教师 · 评分与评论</h2>
        <TeacherRatingBlock teacherId={course.teacher._id} />
      </div>
      <CourseReviewBlock courseId={course._id} />
      <PhotoWall type="course" targetId={course._id} title="课程照片墙（板书/课程大纲）" />
    </div>
  );
}

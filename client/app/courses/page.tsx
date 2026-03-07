'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';

const DAY_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface Course {
  _id: string;
  name: string;
  credits: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacher: { _id: string; name: string; title: string };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/courses${search ? `?q=${encodeURIComponent(search)}` : ''}`)
        .then((r) => r.json())
        .then((data) => { setCourses(Array.isArray(data) ? data : []); setLoading(false); })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="max-w-[980px] mx-auto px-6 py-16">
      <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">课程</h1>
      <p className="mt-3 text-[17px] text-[#86868b]">浏览全部课程，点击教师名查看详情与评分</p>
      <div className="mt-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索课程名称..."
          className="w-full max-w-md px-5 py-3 bg-[#f5f5f7] rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 text-[17px]"
        />
      </div>
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <Link key={course._id} href={`/courses/${course._id}`} className="block p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 group">
              <div className="flex items-start justify-between">
                <h3 className="text-[19px] font-semibold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors">{course.name}</h3>
                <span className="text-[13px] text-[#86868b] bg-[#f5f5f7] px-3 py-1 rounded-full">{course.credits} 学分</span>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-[15px] text-[#86868b]">{course.teacher.name} · {course.teacher.title}</p>
                <p className="text-[15px] text-[#86868b]">{DAY_NAMES[course.dayOfWeek]} {course.startTime} - {course.endTime}</p>
              </div>
              <p className="mt-4 text-[14px] text-[#0071e3] font-medium opacity-0 group-hover:opacity-100 transition-opacity">查看详情、评分与评论 →</p>
            </Link>
          ))}
          {courses.length === 0 && (
            <div className="col-span-full text-center py-16 text-[#86868b] text-[17px]">
              {search ? '未找到匹配的课程' : '暂无课程数据'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';
import LikeButton from '@/components/LikeButton';
import HomeAIAssistant from '@/components/HomeAIAssistant';

const DAY_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface Teacher {
  _id: string;
  name: string;
  title: string;
  department: string;
  likeCount: number;
  reviewCount: number;
  courseCount: number;
}

interface Course {
  _id: string;
  name: string;
  credits: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacher: { _id: string; name: string; title: string };
}

export default function HomePage() {
  const [popular, setPopular] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/teachers/popular`).then((r) => r.json()),
      fetch(`${API_BASE}/courses`).then((r) => r.json()),
    ])
      .then(([tData, cData]) => {
        setPopular(Array.isArray(tData) ? tData : []);
        setCourses(Array.isArray(cData) ? cData.slice(0, 6) : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f7] via-white to-white" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#0071e3]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-[#00c7be]/5 rounded-full blur-3xl" />
        <div className="relative max-w-[980px] mx-auto px-6 pt-24 pb-32 text-center">
          <p className="text-[15px] font-medium text-[#0071e3] tracking-wide uppercase mb-4">高校选课与教师评价平台</p>
          <h1 className="text-[56px] md:text-[72px] font-bold tracking-tight text-[#1d1d1f] leading-[1.05]">
            课星
          </h1>
          <p className="mt-2 text-[20px] md:text-[24px] text-[#6e6e73] font-medium tracking-wide">CoursePilot</p>
          <p className="mt-6 text-[24px] md:text-[28px] text-[#86868b] font-normal max-w-[560px] mx-auto leading-snug">
            让选课更简单。
          </p>
          <p className="mt-6 text-[17px] text-[#86868b] max-w-[480px] mx-auto leading-relaxed">
            浏览课程、查看教师评分与评论、智能选课避坑，一站搞定你的大学选课。
          </p>
          <div className="mt-14 flex flex-wrap justify-center gap-4">
            <Link href="/courses" className="inline-flex items-center gap-2 px-8 py-4 rounded-[980px] bg-[#0071e3] text-white text-[17px] font-medium hover:bg-[#0077ed] transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-[#0071e3]/20">
              浏览课程
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/teachers" className="inline-flex items-center gap-2 px-8 py-4 rounded-[980px] bg-[#1d1d1f] text-white text-[17px] font-medium hover:bg-[#424245] transition-all duration-200 hover:-translate-y-0.5">
              查看教师
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      <HomeAIAssistant />

      {/* Featured Courses */}
      {!loading && courses.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-[980px] mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-[32px] md:text-[40px] font-bold text-[#1d1d1f] tracking-tight">精选课程</h2>
                <p className="mt-2 text-[17px] text-[#86868b]">点击课程查看详情、评分与评论</p>
              </div>
              <Link href="/courses" className="hidden md:block text-[17px] font-medium text-[#0071e3] hover:underline">查看全部</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link key={course._id} href={`/courses/${course._id}`}
                  className="group block p-6 bg-white rounded-3xl border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-[13px] font-medium text-[#0071e3] bg-[#0071e3]/10 px-3 py-1 rounded-full">{course.credits} 学分</span>
                    <span className="text-[13px] text-[#86868b]">{DAY_NAMES[course.dayOfWeek]} {course.startTime}</span>
                  </div>
                  <h3 className="text-[21px] font-semibold text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors mb-2">{course.name}</h3>
                  <p className="text-[15px] text-[#86868b]">{course.teacher.name} · {course.teacher.title}</p>
                  <p className="mt-4 text-[14px] text-[#0071e3] font-medium opacity-0 group-hover:opacity-100 transition-opacity">查看详情、评分与评论 →</p>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/courses" className="text-[17px] font-medium text-[#0071e3] hover:underline">查看全部课程</Link>
            </div>
          </div>
        </section>
      )}

      {/* Popular Teachers */}
      <section className="py-20 px-6 bg-[#f5f5f7] rounded-[32px] mx-4 md:mx-8">
        <div className="max-w-[980px] mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-[32px] md:text-[40px] font-bold text-[#1d1d1f] tracking-tight">热门教师</h2>
            <p className="mt-3 text-[17px] text-[#86868b]">根据学生点赞数量排名</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (Array.isArray(popular) ? popular : []).length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {(Array.isArray(popular) ? popular : []).slice(0, 5).map((t, i) => (
                  <Link key={t._id} href={`/teachers/${t._id}`}
                    className="group block p-6 bg-white rounded-2xl hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0071e3] to-[#00c7be] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg shadow-[#0071e3]/20">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1d1d1f] truncate group-hover:text-[#0071e3] transition-colors text-[17px]">{t.name}</p>
                        <p className="text-[14px] text-[#86868b]">{t.title} · {t.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <LikeButton teacherId={t._id} likeCount={t.likeCount || 0} liked={false} compact />
                      <span className="text-[14px] text-[#86868b]">{t.reviewCount || 0} 条评价</span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-12 text-center">
                <Link href="/teachers?sort=popular" className="inline-flex items-center gap-2 text-[17px] font-medium text-[#0071e3] hover:underline">
                  查看完整排行榜
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </>
          ) : (
            <p className="text-center text-[#86868b] py-12">暂无数据</p>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-[980px] mx-auto">
          <div className="grid md:grid-cols-3 gap-16">
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#0071e3] to-[#0071e3]/80 flex items-center justify-center text-3xl shadow-xl shadow-[#0071e3]/20 group-hover:scale-105 transition-transform">
                📚
              </div>
              <h3 className="mt-6 text-[21px] font-semibold text-[#1d1d1f]">课程一览</h3>
              <p className="mt-3 text-[15px] text-[#86868b] leading-relaxed">浏览全部课程，查看授课教师、学分与时间安排，点击课程即可评分评论。</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#00c7be] to-[#00c7be]/80 flex items-center justify-center text-3xl shadow-xl shadow-[#00c7be]/20 group-hover:scale-105 transition-transform">
                ⭐
              </div>
              <h3 className="mt-6 text-[21px] font-semibold text-[#1d1d1f]">真实评价</h3>
              <p className="mt-3 text-[15px] text-[#86868b] leading-relaxed">学生评分与匿名评论，雷达图直观展示，帮你了解真实课堂体验。</p>
            </div>
            <div className="text-center group">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#86868b] to-[#86868b]/80 flex items-center justify-center text-3xl shadow-xl shadow-gray-400/20 group-hover:scale-105 transition-transform">
                ✓
              </div>
              <h3 className="mt-6 text-[21px] font-semibold text-[#1d1d1f]">选课避坑</h3>
              <p className="mt-3 text-[15px] text-[#86868b] leading-relaxed">时间冲突检测、学分进度条，选课更轻松。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-[#f5f5f7] rounded-t-[32px]">
        <div className="max-w-[980px] mx-auto flex flex-wrap justify-between items-center gap-6">
          <span className="text-[17px] font-semibold text-[#1d1d1f]">课星 CoursePilot</span>
          <div className="flex gap-8">
            <Link href="/courses" className="text-[15px] text-[#86868b] hover:text-[#1d1d1f] transition-colors">课程</Link>
            <Link href="/teachers" className="text-[15px] text-[#86868b] hover:text-[#1d1d1f] transition-colors">教师</Link>
            <Link href="/disclaimer" className="text-[15px] text-[#86868b] hover:text-[#1d1d1f] transition-colors">免责声明</Link>
          </div>
        </div>
        <div className="max-w-[980px] mx-auto mt-8 pt-8 border-t border-gray-200">
          <span className="text-[13px] text-[#86868b]">© 课星 CoursePilot · 高校选课与教师评价平台</span>
        </div>
      </footer>
    </div>
  );
}

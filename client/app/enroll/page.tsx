'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/providers';
import { API_BASE, authHeaders } from '@/lib/api';
import Link from 'next/link';

const DAY_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface Course {
  _id: string; name: string; credits: number; dayOfWeek: number;
  startTime: string; endTime: string; teacher: { _id: string; name: string; title: string };
}

export default function EnrollPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [cd, ed] = await Promise.all([
        fetch(`${API_BASE}/courses`).then((r) => r.json()),
        fetch(`${API_BASE}/user/enrollments`, { headers: authHeaders() }).then((r) => r.json()),
      ]);
      setCourses(cd);
      setEnrolledIds(new Set(ed.map((e: any) => e.course?._id || e.course)));
      setLoading(false);
    } catch { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEnroll = async (courseId: string) => {
    setActionLoading(courseId); setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/enroll`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ courseId }) });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.conflictWith ? `时间冲突！与「${data.conflictWith.name}」(${DAY_NAMES[data.conflictWith.dayOfWeek]} ${data.conflictWith.startTime}-${data.conflictWith.endTime}) 冲突` : data.error;
        setMessage({ text: msg, type: 'error' });
      } else { setMessage({ text: '选课成功', type: 'success' }); fetchData(); }
    } catch { setMessage({ text: '选课失败', type: 'error' }); }
    finally { setActionLoading(null); }
  };

  const handleDrop = async (courseId: string) => {
    setActionLoading(courseId); setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/enroll`, { method: 'DELETE', headers: authHeaders(), body: JSON.stringify({ courseId }) });
      if (res.ok) { setMessage({ text: '退课成功', type: 'success' }); fetchData(); }
    } catch { setMessage({ text: '退课失败', type: 'error' }); }
    finally { setActionLoading(null); }
  };

  if (!user) return <div className="max-w-[980px] mx-auto px-6 py-24 text-center"><h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">请先登录</h2><Link href="/login" className="text-[#0071e3] hover:underline">前往登录</Link></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-[980px] mx-auto px-6 py-16">
      <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">选课中心</h1>
      <p className="mt-3 text-[17px] text-[#86868b]">已选 {enrolledIds.size} 门课程</p>
      {message && (
        <div className={`mt-6 p-4 rounded-2xl text-[15px] ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</div>
      )}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const enrolled = enrolledIds.has(course._id);
          const busy = actionLoading === course._id;
          return (
            <div key={course._id} className={`rounded-2xl border p-6 transition-all duration-300 ${enrolled ? 'border-[#0071e3]/40 bg-[#0071e3]/5' : 'bg-white border-gray-100 hover:shadow-lg hover:border-gray-200'}`}>
              <div className="flex items-start justify-between">
                <h3 className="text-[19px] font-semibold text-[#1d1d1f]">{course.name}</h3>
                <div className="flex items-center gap-2">
                  {enrolled && <span className="text-[12px] text-[#0071e3] font-medium">已选</span>}
                  <span className="text-[13px] text-[#86868b] bg-[#f5f5f7] px-3 py-1 rounded-full">{course.credits} 学分</span>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-[15px] text-[#86868b]">
                <p>教师：{course.teacher.name}</p>
                <p>时间：{DAY_NAMES[course.dayOfWeek]} {course.startTime} - {course.endTime}</p>
              </div>
              <div className="mt-6">
                {enrolled ? (
                  <button onClick={() => handleDrop(course._id)} disabled={busy}
                    className="w-full py-3 rounded-[980px] text-[15px] font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50">{busy ? '处理中...' : '退课'}</button>
                ) : (
                  <button onClick={() => handleEnroll(course._id)} disabled={busy}
                    className="w-full py-3 rounded-[980px] text-[15px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] transition disabled:opacity-50">{busy ? '处理中...' : '选课'}</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

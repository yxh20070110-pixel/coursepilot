'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/providers';
import { API_BASE, authHeaders } from '@/lib/api';
import Link from 'next/link';

const DAY_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const PERIODS = [
  { id: 1, label: '第1节', start: '08:00', end: '08:45' },
  { id: 2, label: '第2节', start: '08:50', end: '09:35' },
  { id: 3, label: '第3节', start: '09:55', end: '10:40' },
  { id: 4, label: '第4节', start: '10:45', end: '11:30' },
  { id: 5, label: '第5节', start: '11:35', end: '12:20' },
  { id: 6, label: '第6节', start: '13:15', end: '14:00' },
  { id: 7, label: '第7节', start: '14:05', end: '14:50' },
  { id: 8, label: '第8节', start: '15:05', end: '15:50' },
  { id: 9, label: '第9节', start: '15:55', end: '16:40' },
  { id: 10, label: '第10节', start: '18:00', end: '18:45' },
  { id: 11, label: '第11节', start: '18:50', end: '19:35' },
  { id: 12, label: '第12节', start: '19:40', end: '20:25' },
];

interface Course {
  _id: string; name: string; credits: number; dayOfWeek: number;
  startTime: string; endTime: string; teacher: { _id: string; name: string; title: string };
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function isCourseInPeriod(course: Course, periodStart: string, periodEnd: string) {
  const cStart = toMinutes(course.startTime);
  const cEnd = toMinutes(course.endTime);
  const pStart = toMinutes(periodStart);
  const pEnd = toMinutes(periodEnd);
  return cStart < pEnd && cEnd > pStart;
}

export default function EnrollPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; periodId: number } | null>(null);

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

  const visibleCourses = selectedSlot
    ? courses.filter((c) => {
        const period = PERIODS.find((p) => p.id === selectedSlot.periodId);
        if (!period) return false;
        return c.dayOfWeek === selectedSlot.day && isCourseInPeriod(c, period.start, period.end);
      })
    : courses;

  if (!user) return <div className="max-w-[980px] mx-auto px-6 py-24 text-center"><h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">请先登录</h2><Link href="/login" className="text-[#0071e3] hover:underline">前往登录</Link></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-12 md:py-16">
      <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">选课中心</h1>
      <p className="mt-3 text-[17px] text-[#86868b]">已选 {enrolledIds.size} 门课程</p>
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-[#1d1d1f]">课程时间表</h2>
          <button
            onClick={() => setSelectedSlot(null)}
            className="text-sm text-[#0071e3] hover:underline"
          >
            查看全部课程
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-200 p-2 bg-[#f5f5f7] text-left text-sm text-[#4b4b50]">节次</th>
                {DAY_NAMES.slice(1).map((d, i) => (
                  <th key={d} className="border border-gray-200 p-2 bg-[#f5f5f7] text-sm text-[#4b4b50]">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period.id}>
                  <td className="border border-gray-200 p-2 text-xs text-[#6e6e73] bg-[#fafafa] whitespace-nowrap">
                    <div className="font-medium text-[#1d1d1f]">{period.label}</div>
                    <div>{period.start}-{period.end}</div>
                  </td>
                  {Array.from({ length: 7 }, (_, idx) => idx + 1).map((day) => {
                    const inSlot = courses.filter((c) => c.dayOfWeek === day && isCourseInPeriod(c, period.start, period.end));
                    const enrolledInSlot = inSlot.filter((c) => enrolledIds.has(c._id));
                    const active = selectedSlot?.day === day && selectedSlot?.periodId === period.id;
                    return (
                      <td key={`${period.id}-${day}`} className="border border-gray-200 p-1">
                        <button
                          onClick={() => setSelectedSlot({ day, periodId: period.id })}
                          className={`w-full min-h-[54px] rounded-md text-xs px-1.5 py-2 transition ${
                            active
                              ? 'bg-[#0071e3] text-white'
                              : enrolledInSlot.length > 0
                              ? 'bg-[#0071e3]/15 text-[#1d1d1f]'
                              : inSlot.length > 0
                              ? 'bg-[#f5f5f7] text-[#4b4b50]'
                              : 'bg-white text-[#b0b0b5]'
                          }`}
                        >
                          {enrolledInSlot.length > 0
                            ? `已选 ${enrolledInSlot.length} 门`
                            : inSlot.length > 0
                            ? `${inSlot.length} 门课`
                            : '空闲'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedSlot && (
          <p className="mt-4 text-sm text-[#6e6e73]">
            当前筛选：{DAY_NAMES[selectedSlot.day]} · {PERIODS.find((p) => p.id === selectedSlot.periodId)?.label}
            （{PERIODS.find((p) => p.id === selectedSlot.periodId)?.start}-{PERIODS.find((p) => p.id === selectedSlot.periodId)?.end}）
          </p>
        )}
      </div>
      {message && (
        <div className={`mt-6 p-4 rounded-2xl text-[15px] ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</div>
      )}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCourses.map((course) => {
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
        {visibleCourses.length === 0 && (
          <div className="col-span-full text-center py-16 text-[#86868b]">
            当前时间段暂无可选课程，请选择其他时间段。
          </div>
        )}
      </div>
    </div>
  );
}

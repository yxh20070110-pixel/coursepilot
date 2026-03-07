'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/providers';
import CreditProgress from '@/components/CreditProgress';
import { API_BASE, authHeaders } from '@/lib/api';
import Link from 'next/link';

const DAY_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

interface CreditData { earnedCredits: number; requiredCredits: number; percentage: number; }
interface Enrollment { _id: string; course: { _id: string; name: string; credits: number; dayOfWeek: number; startTime: string; endTime: string; teacher: { name: string } }; }

export default function ProfilePage() {
  const { user } = useAuth();
  const [creditData, setCreditData] = useState<CreditData | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [credit, enroll] = await Promise.all([
        fetch(`${API_BASE}/user/credit-progress`, { headers: authHeaders() }).then((r) => r.json()),
        fetch(`${API_BASE}/user/enrollments`, { headers: authHeaders() }).then((r) => r.json()),
      ]);
      setCreditData(credit);
      setEnrollments(enroll);
      setLoading(false);
    } catch { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user) return <div className="max-w-[980px] mx-auto px-6 py-24 text-center"><h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">请先登录</h2><Link href="/login" className="text-[#0071e3] hover:underline">前往登录</Link></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-[980px] mx-auto px-6 py-16">
      <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">个人中心</h1>
      <p className="mt-3 text-[17px] text-[#86868b]">{user.name} · {user.email}</p>
      <div className="mt-12 p-8 bg-white rounded-2xl border border-gray-100">
        <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-6">学分进度</h2>
        {creditData && <CreditProgress {...creditData} />}
      </div>
      <div className="mt-8 p-8 bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[21px] font-semibold text-[#1d1d1f]">已选课程</h2>
          <span className="text-[15px] text-[#86868b]">{enrollments.length} 门</span>
        </div>
        {enrollments.length === 0 ? (
          <div className="text-center py-16"><p className="text-[#86868b]">暂无已选课程</p><Link href="/enroll" className="text-[15px] text-[#0071e3] hover:underline mt-2 inline-block">前往选课</Link></div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((e) => (
              <div key={e._id} className="flex justify-between items-center p-5 bg-[#f5f5f7] rounded-2xl">
                <div>
                  <p className="font-semibold text-[#1d1d1f]">{e.course.name}</p>
                  <p className="text-[14px] text-[#86868b] mt-1">{e.course.teacher.name} · {DAY_NAMES[e.course.dayOfWeek]} {e.course.startTime}-{e.course.endTime}</p>
                </div>
                <span className="text-[14px] text-[#0071e3] font-medium">{e.course.credits} 学分</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

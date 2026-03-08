'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/providers';
import { API_BASE, authHeaders } from '@/lib/api';
import Link from 'next/link';

interface PlanItem { courseName: string; satisfied: boolean; }
interface PlanData {
  major: string;
  grade: number;
  semester: number | null;
  availableSemesters: number[];
  items: PlanItem[];
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [major, setMajor] = useState('');
  const [grade, setGrade] = useState<number>(new Date().getFullYear());
  const [semester, setSemester] = useState<number | null>(null);
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchData = useCallback(async (targetSemester?: number | null) => {
    if (!user) { setLoading(false); return; }
    try {
      const query = targetSemester ? `?semester=${targetSemester}` : '';
      const data = await fetch(`${API_BASE}/user/training-plan${query}`, { headers: authHeaders() }).then((r) => r.json());
      setPlanData(data);
      setMajor(data.major || '');
      setGrade(Number(data.grade || new Date().getFullYear()));
      setSemester(data.semester || null);
      setLoading(false);
    } catch { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveProfile = async () => {
    if (!major.trim() || !grade) return;
    setSaving(true);
    setMsg('');
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ major: major.trim(), grade }),
    });
    if (res.ok) {
      setMsg('已保存专业和年级');
      await fetchData(semester);
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || '保存失败');
    }
    setSaving(false);
  };

  if (!user) return <div className="max-w-[980px] mx-auto px-6 py-24 text-center"><h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">请先登录</h2><Link href="/login" className="text-[#0071e3] hover:underline">前往登录</Link></div>;
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-[980px] mx-auto px-6 py-16">
      <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">个人中心</h1>
      <p className="mt-3 text-[17px] text-[#86868b]">{user.name} · {user.email}</p>
      <div className="mt-12 p-8 bg-white rounded-2xl border border-gray-100">
        <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-6">培养计划</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="专业，例如：计算机科学与技术"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
          />
          <input
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            type="number"
            placeholder="年级，例如：2024"
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
          />
          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            value={semester || ''}
            onChange={(e) => {
              const s = Number(e.target.value || 0) || null;
              setSemester(s);
              fetchData(s);
            }}
          >
            <option value="">本学期</option>
            {(planData?.availableSemesters || []).map((s) => <option key={s} value={s}>第{s}学期</option>)}
          </select>
          <button onClick={saveProfile} disabled={saving} className="px-4 py-2 bg-[#0071e3] text-white rounded-lg text-sm hover:bg-[#0077ed] disabled:opacity-60">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
        {msg && <p className="mt-3 text-sm text-[#86868b]">{msg}</p>}
        {(!major || !grade) ? (
          <p className="text-[#86868b] mt-6">请先选择你的专业和年级。</p>
        ) : (
          <div className="mt-6 space-y-3">
            {(planData?.items || []).map((item, idx) => (
              <div key={`${item.courseName}-${idx}`} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex w-5 h-5 rounded border items-center justify-center text-xs ${item.satisfied ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-transparent'}`}>✓</span>
                  <span className="text-[#1d1d1f]">{item.courseName}</span>
                </div>
                <span className={`text-xs ${item.satisfied ? 'text-green-600' : 'text-gray-400'}`}>{item.satisfied ? '已满足' : '待完成'}</span>
              </div>
            ))}
            {(planData?.items || []).length === 0 && (
              <div className="text-center py-10 text-[#86868b]">
                暂无该专业该年级的培养计划，请联系管理员配置。
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

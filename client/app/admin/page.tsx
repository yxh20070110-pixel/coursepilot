'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/app/providers';
import { API_BASE, authHeaders } from '@/lib/api';
import { useRouter } from 'next/navigation';

type Tab = 'teachers' | 'courses' | 'plans' | 'import' | 'comments' | 'users';
const DAY = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const TABS: { key: Tab; label: string }[] = [
  { key: 'teachers', label: '教师管理' }, { key: 'courses', label: '课程管理' },
  { key: 'plans', label: '培养计划' },
  { key: 'import', label: 'Excel 导入' },
  { key: 'comments', label: '评论管理' }, { key: 'users', label: '用户管理' },
];

const defaultSlotsText = '周1 08:00-09:40';
const emptyPlanItem = () => ({ key: `${Date.now()}-${Math.random()}`, query: '', courseName: '', courseId: '' });

function parseSlotsText(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const m = line.match(/^周?([1-7])\s+(\d{1,2}:\d{1,2})-(\d{1,2}:\d{1,2})$/);
    if (!m) return null;
    const norm = (t: string) => {
      const [h, min] = t.split(':');
      return `${h.padStart(2, '0')}:${min.padStart(2, '0')}`;
    };
    return { dayOfWeek: Number(m[1]), startTime: norm(m[2]), endTime: norm(m[3]) };
  }).filter(Boolean) as Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
}

function slotsToText(slots?: Array<{ dayOfWeek: number; startTime: string; endTime: string }>, fallback?: any) {
  const valid = Array.isArray(slots) && slots.length > 0
    ? slots
    : [{ dayOfWeek: fallback?.dayOfWeek || 1, startTime: fallback?.startTime || '08:00', endTime: fallback?.endTime || '09:40' }];
  return valid.map((s) => `周${s.dayOfWeek} ${s.startTime}-${s.endTime}`).join('\n');
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('teachers');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [tForm, setTF] = useState({ name: '', title: '', department: '', researchArea: '', tags: '' });
  const [editT, setEditT] = useState<string | null>(null);
  const [cForm, setCF] = useState({
    name: '', credits: 3, dayOfWeek: 1, startTime: '08:00', endTime: '09:40', teacher: '', scheduleSlotsText: defaultSlotsText,
    courseCode: '', classroom: '', weeks: '', capacity: 0,
  });
  const [editC, setEditC] = useState<string | null>(null);
  const [pForm, setPF] = useState({
    major: '',
    grade: new Date().getFullYear(),
    semester: 1,
    items: [emptyPlanItem()],
  });
  const [editP, setEditP] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    const h = authHeaders();
    const [t, c, p, cm, u] = await Promise.all([
      fetch(`${API_BASE}/admin/teachers`, { headers: h }).then(r => r.json()),
      fetch(`${API_BASE}/admin/courses`, { headers: h }).then(r => r.json()),
      fetch(`${API_BASE}/admin/training-plans`, { headers: h }).then(r => r.json()),
      fetch(`${API_BASE}/admin/comments`, { headers: h }).then(r => r.json()),
      fetch(`${API_BASE}/admin/users`, { headers: h }).then(r => r.json()),
    ]);
    setTeachers(t); setCourses(c); setPlans(p); setComments(cm); setUsers(u);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { if (!authLoading && (!user || user.role !== 'admin')) router.push('/login'); }, [user, authLoading, router]);

  if (authLoading || !user || user.role !== 'admin') return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;

  const h = authHeaders();

  const saveT = async () => {
    if (editT) await fetch(`${API_BASE}/admin/teachers/${editT}`, { method: 'PUT', headers: h, body: JSON.stringify(tForm) });
    else await fetch(`${API_BASE}/admin/teachers`, { method: 'POST', headers: h, body: JSON.stringify(tForm) });
    setTF({ name: '', title: '', department: '', researchArea: '', tags: '' }); setEditT(null); fetchAll();
  };
  const delT = async (id: string) => { if (!confirm('确定删除？')) return; await fetch(`${API_BASE}/admin/teachers/${id}`, { method: 'DELETE', headers: h }); fetchAll(); };

  const saveC = async () => {
    const slots = parseSlotsText(cForm.scheduleSlotsText);
    if (!slots.length) { alert('请至少填写一个有效上课时间，例如：周1 08:00-09:40'); return; }
    const payload = { ...cForm, scheduleSlots: slots, dayOfWeek: slots[0].dayOfWeek, startTime: slots[0].startTime, endTime: slots[0].endTime };
    if (editC) await fetch(`${API_BASE}/admin/courses/${editC}`, { method: 'PUT', headers: h, body: JSON.stringify(payload) });
    else await fetch(`${API_BASE}/admin/courses`, { method: 'POST', headers: h, body: JSON.stringify(payload) });
    setCF({
      name: '', credits: 3, dayOfWeek: 1, startTime: '08:00', endTime: '09:40', teacher: '', scheduleSlotsText: defaultSlotsText,
      courseCode: '', classroom: '', weeks: '', capacity: 0,
    }); setEditC(null); fetchAll();
  };
  const delC = async (id: string) => { if (!confirm('确定删除？')) return; await fetch(`${API_BASE}/admin/courses/${id}`, { method: 'DELETE', headers: h }); fetchAll(); };
  const delCm = async (id: string) => { if (!confirm('确定删除？')) return; await fetch(`${API_BASE}/admin/comments/${id}`, { method: 'DELETE', headers: h }); fetchAll(); };
  const saveP = async () => {
    const items = pForm.items
      .filter((item) => item.courseId && item.courseName)
      .map((item) => ({ courseName: item.courseName, courseId: item.courseId, required: true }));
    const payload = { major: pForm.major.trim(), grade: Number(pForm.grade), semester: Number(pForm.semester), items };
    if (!payload.major || !payload.grade || !payload.semester) return;
    if (!items.length) { alert('请至少绑定一门已有课程'); return; }
    if (editP) await fetch(`${API_BASE}/admin/training-plans/${editP}`, { method: 'PUT', headers: h, body: JSON.stringify(payload) });
    else await fetch(`${API_BASE}/admin/training-plans`, { method: 'POST', headers: h, body: JSON.stringify(payload) });
    setPF({ major: '', grade: new Date().getFullYear(), semester: 1, items: [emptyPlanItem()] }); setEditP(null); fetchAll();
  };
  const delP = async (id: string) => { if (!confirm('确定删除？')) return; await fetch(`${API_BASE}/admin/training-plans/${id}`, { method: 'DELETE', headers: h }); fetchAll(); };

  const runImport = async (previewOnly: boolean) => {
    if (!importFile) return;
    setImporting(true);
    const form = new FormData();
    form.append('file', importFile);
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/admin/import/courses?preview=${previewOnly ? 'true' : 'false'}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    setImportPreview(data);
    setImporting(false);
    if (!previewOnly && res.ok) fetchAll();
  };

  const inputCls = 'px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const formatCourseOption = (c: any) => c.name;
  const courseOptions = courses.map((c: any) => ({ id: String(c._id), name: c.name, label: formatCourseOption(c) }));
  const applyCourseByValue = (idx: number, value: string) => {
    const matched = courseOptions.find((opt) => opt.label === value) || courseOptions.find((opt) => opt.name === value);
    setPF((prev) => {
      const nextItems = [...prev.items];
      const current = nextItems[idx];
      if (!current) return prev;
      if (matched) {
        nextItems[idx] = { ...current, query: value, courseId: matched.id, courseName: matched.name };
      } else {
        nextItems[idx] = { ...current, query: value, courseId: '', courseName: '' };
      }
      return { ...prev, items: nextItems };
    });
  };
  const applyCourseById = (idx: number, courseId: string) => {
    const matched = courseOptions.find((opt) => opt.id === courseId);
    setPF((prev) => {
      const nextItems = [...prev.items];
      const current = nextItems[idx];
      if (!current) return prev;
      if (matched) {
        nextItems[idx] = { ...current, query: matched.label, courseId: matched.id, courseName: matched.name };
      } else {
        nextItems[idx] = { ...current, query: '', courseId: '', courseName: '' };
      }
      return { ...prev, items: nextItems };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">管理后台</h1>
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'teachers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
            <input placeholder="姓名" value={tForm.name} onChange={e => setTF(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            <input placeholder="职称" value={tForm.title} onChange={e => setTF(f => ({ ...f, title: e.target.value }))} className={inputCls} />
            <input placeholder="院系" value={tForm.department} onChange={e => setTF(f => ({ ...f, department: e.target.value }))} className={inputCls} />
            <input placeholder="研究方向" value={tForm.researchArea} onChange={e => setTF(f => ({ ...f, researchArea: e.target.value }))} className={inputCls} />
            <input placeholder="标签(逗号分隔)" value={tForm.tags} onChange={e => setTF(f => ({ ...f, tags: e.target.value }))} className={inputCls} />
            <button onClick={saveT} disabled={!tForm.name} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">{editT ? '保存修改' : '添加教师'}</button>
          </div>
          {editT && <button onClick={() => { setEditT(null); setTF({ name: '', title: '', department: '', researchArea: '', tags: '' }); }} className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">取消编辑</button>}
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-gray-200">
              <th className="pb-3 font-medium text-gray-500">姓名</th><th className="pb-3 font-medium text-gray-500">职称</th>
              <th className="pb-3 font-medium text-gray-500">院系</th><th className="pb-3 font-medium text-gray-500">研究方向</th><th className="pb-3 font-medium text-gray-500">标签</th><th className="pb-3 font-medium text-gray-500">操作</th>
            </tr></thead>
            <tbody>{teachers.map((t: any) => (
              <tr key={t._id} className="border-b border-gray-50">
                <td className="py-3 font-medium">{t.name}</td><td className="py-3 text-gray-600">{t.title}</td><td className="py-3 text-gray-600">{t.department}</td><td className="py-3 text-gray-600">{t.researchArea || '-'}</td><td className="py-3 text-gray-600">{Array.isArray(t.tags) ? t.tags.join(', ') : '-'}</td>
                <td className="py-3 space-x-3">
                  <button onClick={() => { setTF({ name: t.name, title: t.title || '', department: t.department || '', researchArea: t.researchArea || '', tags: Array.isArray(t.tags) ? t.tags.join(',') : '' }); setEditT(t._id); }} className="text-blue-600 hover:underline">编辑</button>
                  <button onClick={() => delT(t._id)} className="text-red-600 hover:underline">删除</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === 'courses' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3 mb-3">
            <input placeholder="课程名" value={cForm.name} onChange={e => setCF(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            <input placeholder="课程代码" value={cForm.courseCode} onChange={e => setCF(f => ({ ...f, courseCode: e.target.value }))} className={inputCls} />
            <input type="number" placeholder="学分" value={cForm.credits} onChange={e => setCF(f => ({ ...f, credits: +e.target.value }))} className={inputCls} />
            <select value={cForm.dayOfWeek} onChange={e => setCF(f => ({ ...f, dayOfWeek: +e.target.value }))} className={inputCls} disabled>
              {[1,2,3,4,5,6,7].map(d => <option key={d} value={d}>{DAY[d]}</option>)}
            </select>
            <input type="time" value={cForm.startTime} onChange={e => setCF(f => ({ ...f, startTime: e.target.value }))} className={inputCls} disabled />
            <input type="time" value={cForm.endTime} onChange={e => setCF(f => ({ ...f, endTime: e.target.value }))} className={inputCls} disabled />
            <input placeholder="教室" value={cForm.classroom} onChange={e => setCF(f => ({ ...f, classroom: e.target.value }))} className={inputCls} />
            <input placeholder="周次" value={cForm.weeks} onChange={e => setCF(f => ({ ...f, weeks: e.target.value }))} className={inputCls} />
            <input type="number" placeholder="容量" value={cForm.capacity} onChange={e => setCF(f => ({ ...f, capacity: +e.target.value }))} className={inputCls} />
            <select value={cForm.teacher} onChange={e => setCF(f => ({ ...f, teacher: e.target.value }))} className={inputCls}>
              <option value="">选择教师</option>
              {teachers.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            <button onClick={saveC} disabled={!cForm.name || !cForm.teacher} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">{editC ? '保存' : '添加'}</button>
          </div>
          <textarea
            placeholder={'每行一个时间段，例如：\n周1 08:00-09:40\n周3 14:05-14:50'}
            value={cForm.scheduleSlotsText}
            onChange={(e) => setCF((f) => ({ ...f, scheduleSlotsText: e.target.value }))}
            className={`${inputCls} w-full min-h-[88px] mb-6`}
          />
          {editC && <button onClick={() => { setEditC(null); setCF({ name: '', credits: 3, dayOfWeek: 1, startTime: '08:00', endTime: '09:40', teacher: '', scheduleSlotsText: defaultSlotsText, courseCode: '', classroom: '', weeks: '', capacity: 0 }); }} className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">取消编辑</button>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b border-gray-200">
                <th className="pb-3 font-medium text-gray-500">课程</th><th className="pb-3 font-medium text-gray-500">代码</th><th className="pb-3 font-medium text-gray-500">学分</th>
                <th className="pb-3 font-medium text-gray-500">教师</th><th className="pb-3 font-medium text-gray-500">时间</th><th className="pb-3 font-medium text-gray-500">教室</th><th className="pb-3 font-medium text-gray-500">周次</th><th className="pb-3 font-medium text-gray-500">容量</th><th className="pb-3 font-medium text-gray-500">操作</th>
              </tr></thead>
              <tbody>{courses.map((c: any) => (
                <tr key={c._id} className="border-b border-gray-50">
                  <td className="py-3 font-medium">{c.name}</td><td className="py-3 text-gray-600">{c.courseCode || '-'}</td><td className="py-3 text-gray-600">{c.credits}</td>
                  <td className="py-3 text-gray-600">{c.teacher?.name || '-'}</td>
                  <td className="py-3 text-gray-600">
                    {(Array.isArray(c.scheduleSlots) && c.scheduleSlots.length > 0 ? c.scheduleSlots : [{ dayOfWeek: c.dayOfWeek, startTime: c.startTime, endTime: c.endTime }])
                      .map((s: any) => `${DAY[s.dayOfWeek]} ${s.startTime}-${s.endTime}`)
                      .join(' / ')}
                  </td><td className="py-3 text-gray-600">{c.classroom || '-'}</td><td className="py-3 text-gray-600">{c.weeks || '-'}</td><td className="py-3 text-gray-600">{c.capacity || 0}</td>
                  <td className="py-3 space-x-3">
                    <button onClick={() => { setCF({ name: c.name, credits: c.credits, dayOfWeek: c.dayOfWeek, startTime: c.startTime, endTime: c.endTime, teacher: c.teacher?._id || '', scheduleSlotsText: slotsToText(c.scheduleSlots, c), courseCode: c.courseCode || '', classroom: c.classroom || '', weeks: c.weeks || '', capacity: c.capacity || 0 }); setEditC(c._id); }} className="text-blue-600 hover:underline">编辑</button>
                    <button onClick={() => delC(c._id)} className="text-red-600 hover:underline">删除</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
            <input placeholder="专业（如：计算机科学与技术）" value={pForm.major} onChange={e => setPF(f => ({ ...f, major: e.target.value }))} className={inputCls} />
            <input type="number" placeholder="年级（如：2024）" value={pForm.grade} onChange={e => setPF(f => ({ ...f, grade: +e.target.value }))} className={inputCls} />
            <input type="number" placeholder="学期（如：1）" value={pForm.semester} onChange={e => setPF(f => ({ ...f, semester: +e.target.value }))} className={inputCls} />
            <button onClick={saveP} disabled={!pForm.major || !pForm.grade || !pForm.semester} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">{editP ? '保存计划' : '新增计划'}</button>
            {editP && <button onClick={() => { setEditP(null); setPF({ major: '', grade: new Date().getFullYear(), semester: 1, items: [emptyPlanItem()] }); }} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition">取消编辑</button>}
          </div>
          <datalist id="plan-course-options">
            {courseOptions.map((opt) => (
              <option key={opt.id} value={opt.label} />
            ))}
          </datalist>
          <div className="space-y-3 mb-6">
            {pForm.items.map((item, idx) => (
              <div key={item.key} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <input
                  list="plan-course-options"
                  placeholder="输入课程名自动补全（可直接选下拉）"
                  value={item.query}
                  onChange={(e) => applyCourseByValue(idx, e.target.value)}
                  className={`md:col-span-7 ${inputCls}`}
                />
                <select
                  value={item.courseId}
                  onChange={(e) => applyCourseById(idx, e.target.value)}
                  className={`md:col-span-4 ${inputCls}`}
                >
                  <option value="">或从下拉选择课程</option>
                  {courseOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
                <button
                  onClick={() => setPF((prev) => ({ ...prev, items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== idx) : prev.items }))}
                  className="md:col-span-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition"
                >
                  删除
                </button>
                <div className="md:col-span-12 text-xs text-gray-500">
                  {item.courseId ? `已绑定 courseId: ${item.courseId}` : '尚未绑定到已有课程'}
                </div>
              </div>
            ))}
            <button
              onClick={() => setPF((prev) => ({ ...prev, items: [...prev.items, emptyPlanItem()] }))}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
            >
              + 添加课程
            </button>
          </div>
          <div className="space-y-3">
            {plans.map((p: any) => (
              <div key={p._id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium">{p.major} · {p.grade}级 · 第{p.semester}学期</div>
                  <div className="space-x-3 text-sm">
                    <button onClick={() => {
                      setPF({
                        major: p.major,
                        grade: p.grade,
                        semester: p.semester,
                        items: (p.items || []).map((i: any) => {
                          const cid = typeof i.courseId === 'string' ? i.courseId : String(i.courseId?._id || '');
                          const matched = courseOptions.find((opt) => opt.id === cid);
                          return {
                            key: `${Date.now()}-${Math.random()}`,
                            query: matched?.label || i.courseName,
                            courseName: i.courseName,
                            courseId: cid,
                          };
                        }).concat((p.items || []).length ? [] : [emptyPlanItem()]),
                      });
                      setEditP(p._id);
                    }} className="text-blue-600 hover:underline">编辑</button>
                    <button onClick={() => delP(p._id)} className="text-red-600 hover:underline">删除</button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">{(p.items || []).map((i: any) => i.courseName).join('、') || '暂无课程'}</div>
              </div>
            ))}
            {plans.length === 0 && <p className="text-gray-400 text-sm">暂无培养计划</p>}
          </div>
        </div>
      )}

      {tab === 'import' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Excel 导入课程</h2>
          <p className="text-sm text-gray-500">模板列：courseName, teacherName, credits, dayOfWeek, startTime, endTime, department, title, classroom, weeks, courseCode, capacity</p>
          <input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)} className={inputCls} />
          <div className="flex gap-3">
            <button disabled={!importFile || importing} onClick={() => runImport(true)} className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50">预览导入</button>
            <button disabled={!importFile || importing} onClick={() => runImport(false)} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">确认导入</button>
          </div>
          {importPreview && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="p-3 bg-gray-50 rounded">总行数：{importPreview.totalRows ?? 0}</div>
                <div className="p-3 bg-green-50 rounded">新增课程：{importPreview.createdCourses ?? 0}</div>
                <div className="p-3 bg-blue-50 rounded">新增教师：{importPreview.createdTeachers ?? 0}</div>
                <div className="p-3 bg-yellow-50 rounded">警告：{(importPreview.warnings || []).length}</div>
                <div className="p-3 bg-red-50 rounded">错误：{(importPreview.errors || []).length}</div>
              </div>
              {(importPreview.errors || []).length > 0 && (
                <div className="max-h-40 overflow-auto border rounded p-2 bg-red-50">
                  {(importPreview.errors || []).map((e: any, idx: number) => <div key={idx}>第 {e.row} 行：{e.error}</div>)}
                </div>
              )}
              {(importPreview.preview || []).length > 0 && (
                <div className="overflow-auto border rounded">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50"><tr><th className="p-2 text-left">行</th><th className="p-2 text-left">课程</th><th className="p-2 text-left">教师</th><th className="p-2 text-left">学分</th><th className="p-2 text-left">时间</th></tr></thead>
                    <tbody>{(importPreview.preview || []).map((p: any) => <tr key={p.row} className="border-t"><td className="p-2">{p.row}</td><td className="p-2">{p.courseName}</td><td className="p-2">{p.teacherName}</td><td className="p-2">{p.credits}</td><td className="p-2">周{p.dayOfWeek} {p.startTime}-{p.endTime}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'comments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left border-b border-gray-200">
                <th className="pb-3 font-medium text-gray-500">用户</th><th className="pb-3 font-medium text-gray-500">教师</th>
                <th className="pb-3 font-medium text-gray-500">内容</th><th className="pb-3 font-medium text-gray-500">匿名</th>
                <th className="pb-3 font-medium text-gray-500">时间</th><th className="pb-3 font-medium text-gray-500">操作</th>
              </tr></thead>
              <tbody>{comments.map((c: any) => (
                <tr key={c._id} className="border-b border-gray-50">
                  <td className="py-3"><div className="font-medium">{c.user?.name || '-'}</div><div className="text-xs text-gray-400">{c.user?.email}</div></td>
                  <td className="py-3 text-gray-600">{c.teacher?.name || '-'}</td>
                  <td className="py-3 text-gray-600 max-w-xs"><div className="truncate">{c.content}</div></td>
                  <td className="py-3">{c.isAnonymous ? <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">匿名</span> : <span className="text-xs text-gray-400">公开</span>}</td>
                  <td className="py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString('zh-CN')}</td>
                  <td className="py-3"><button onClick={() => delCm(c._id)} className="text-red-600 hover:underline">删除</button></td>
                </tr>
              ))}</tbody>
            </table>
            {comments.length === 0 && <p className="text-center text-gray-400 py-8">暂无评论</p>}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b border-gray-200">
              <th className="pb-3 font-medium text-gray-500">姓名</th><th className="pb-3 font-medium text-gray-500">邮箱</th>
              <th className="pb-3 font-medium text-gray-500">角色</th><th className="pb-3 font-medium text-gray-500">注册时间</th>
            </tr></thead>
            <tbody>{users.map((u: any) => (
              <tr key={u._id} className="border-b border-gray-50">
                <td className="py-3 font-medium">{u.name}</td><td className="py-3 text-gray-600">{u.email}</td>
                <td className="py-3">{u.role === 'admin' ? <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">管理员</span> : <span className="text-xs text-gray-400">用户</span>}</td>
                <td className="py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

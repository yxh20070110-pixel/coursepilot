'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import RadarChart from '@/components/RadarChart';
import LikeButton from '@/components/LikeButton';
import { API_BASE, authHeaders } from '@/lib/api';

const SCORE_FIELDS = [
  { key: 'teachingQuality', label: '教学质量' },
  { key: 'workload', label: '作业量' },
  { key: 'gradingFairness', label: '给分公平' },
  { key: 'difficulty', label: '课程难度' },
] as const;

interface Teacher {
  _id: string;
  name: string;
  title: string;
  department: string;
  avgScores: { teachingQuality: number; workload: number; gradingFairness: number; difficulty: number };
  reviewCount: number;
  likeCount?: number;
  liked?: boolean;
}

interface Comment { id: string; content: string; isAnonymous: boolean; userName: string; createdAt: string; }

interface TeacherRatingBlockProps {
  teacherId: string;
  compact?: boolean;
}

export default function TeacherRatingBlock({ teacherId, compact }: TeacherRatingBlockProps) {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({ teachingQuality: 3, workload: 3, gradingFairness: 3, difficulty: 3 });
  const [reviewStatus, setReviewStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [commentStatus, setCommentStatus] = useState<{ text: string; ok: boolean } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchTeacher = useCallback(() => {
    fetch(`${API_BASE}/teachers/${teacherId}`, { headers: authHeaders() as HeadersInit })
      .then((r) => r.json()).then((d) => { setTeacher(d); setLoading(false); }).catch(() => setLoading(false));
  }, [teacherId]);

  const fetchComments = useCallback(() => {
    fetch(`${API_BASE}/comments/teacher/${teacherId}`).then((r) => r.json()).then(setComments).catch(() => {});
  }, [teacherId]);

  useEffect(() => { fetchTeacher(); fetchComments(); }, [fetchTeacher, fetchComments]);

  const handleSubmitReview = async () => {
    if (!user) return;
    setSubmittingReview(true); setReviewStatus(null);
    try {
      const res = await fetch(`${API_BASE}/review`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ teacherId, ...scores }) });
      setReviewStatus({ text: res.ok ? '评分提交成功！' : (await res.json()).error, ok: res.ok });
      if (res.ok) fetchTeacher();
    } catch { setReviewStatus({ text: '提交失败', ok: false }); }
    finally { setSubmittingReview(false); }
  };

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim()) return;
    setSubmittingComment(true); setCommentStatus(null);
    try {
      const res = await fetch(`${API_BASE}/comments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ teacherId, content: commentText, isAnonymous }) });
      const data = await res.json();
      if (res.ok) { setCommentStatus({ text: '评论提交成功，待管理员审核后展示', ok: true }); setCommentText(''); }
      else setCommentStatus({ text: data.error, ok: false });
    } catch { setCommentStatus({ text: '发表失败', ok: false }); }
    finally { setSubmittingComment(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" /></div>;
  if (!teacher) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0071e3] to-[#00c7be] flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">{teacher.name[0]}</div>
          <div>
            <h3 className="text-[21px] font-semibold text-[#1d1d1f]">{teacher.name}</h3>
            <p className="text-[15px] text-[#86868b]">{teacher.title} · {teacher.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LikeButton teacherId={teacher._id} likeCount={teacher.likeCount || 0} liked={teacher.liked} />
          <Link href={`/teachers/${teacher._id}`} className="text-[15px] text-[#0071e3] hover:underline">查看完整页面</Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <h4 className="text-[17px] font-semibold text-[#1d1d1f] mb-6">授课教师评分</h4>
        {teacher.reviewCount > 0 ? (
          <>
            <RadarChart data={teacher.avgScores} />
            {!compact && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {SCORE_FIELDS.map(({ key, label }) => (
                  <div key={key} className="text-center p-3 bg-[#f5f5f7] rounded-xl">
                    <div className="text-xl font-bold text-[#0071e3]">{teacher.avgScores[key].toFixed(1)}</div>
                    <div className="text-xs text-[#86868b] mt-1">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : <p className="text-[#86868b] text-center py-12">暂无评价，成为第一个评分者</p>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <h4 className="text-[17px] font-semibold text-[#1d1d1f] mb-6">提交评分</h4>
        {user ? (
          <div className="space-y-5">
            {SCORE_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-[15px] font-medium text-[#1d1d1f] w-20">{label}</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button key={val} onClick={() => setScores((p) => ({ ...p, [key]: val }))}
                      className={`w-10 h-10 rounded-full text-[15px] font-medium transition-all ${scores[key] === val ? 'bg-[#0071e3] text-white' : 'bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]'}`}>{val}</button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={handleSubmitReview} disabled={submittingReview}
              className="w-full py-3 rounded-[980px] bg-[#0071e3] text-white font-medium hover:bg-[#0077ed] transition disabled:opacity-50">
              {submittingReview ? '提交中...' : '提交评分'}
            </button>
            {reviewStatus && <div className={`text-center text-[15px] p-3 rounded-xl ${reviewStatus.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{reviewStatus.text}</div>}
          </div>
        ) : <p className="text-center text-[#86868b] py-6">请先 <Link href="/login" className="text-[#0071e3] hover:underline">登录</Link> 后评分</p>}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <h4 className="text-[17px] font-semibold text-[#1d1d1f] mb-6">评论区</h4>
        {user ? (
          <div className="space-y-4 mb-6">
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你对这位老师的评价..." rows={3}
              className="w-full px-4 py-3 bg-[#f5f5f7] rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 text-[15px] resize-none" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-[15px] text-[#86868b]">
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded" />
                匿名发表
              </label>
              <button onClick={handleSubmitComment} disabled={submittingComment || !commentText.trim()}
                className="px-6 py-2.5 rounded-[980px] bg-[#0071e3] text-white text-[15px] font-medium hover:bg-[#0077ed] transition disabled:opacity-50">
                {submittingComment ? '发表中...' : '发表评论'}
              </button>
            </div>
            {commentStatus && <div className={`text-[15px] p-3 rounded-xl ${commentStatus.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{commentStatus.text}</div>}
          </div>
        ) : <div className="mb-6 p-6 bg-[#f5f5f7] rounded-2xl text-center text-[#86868b]">请先 <Link href="/login" className="text-[#0071e3] hover:underline">登录</Link> 后发表评论</div>}
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="p-4 bg-[#f5f5f7] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[15px] font-medium ${c.isAnonymous ? 'text-[#86868b] italic' : 'text-[#1d1d1f]'}`}>{c.userName}</span>
                <span className="text-[13px] text-[#86868b]">{new Date(c.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
              <p className="text-[15px] text-[#1d1d1f] leading-relaxed">{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-center text-[#86868b] py-8">暂无评论</p>}
        </div>
      </div>
    </div>
  );
}

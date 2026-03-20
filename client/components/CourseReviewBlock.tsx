'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { API_BASE, authHeaders } from '@/lib/api';
import { useAuth } from '@/app/providers';

interface CourseReview {
  id: string;
  rating: number;
  content: string;
  isAnonymous: boolean;
  userName: string;
  createdAt: string;
}

interface CourseReviewResponse {
  ratingAvg: number;
  reviewCount: number;
  reviews: CourseReview[];
}

export default function CourseReviewBlock({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<CourseReviewResponse>({ ratingAvg: 0, reviewCount: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(4);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string>('');

  const fetchData = () => {
    fetch(`${API_BASE}/course-reviews/course/${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        setData({
          ratingAvg: d?.ratingAvg || 0,
          reviewCount: d?.reviewCount || 0,
          reviews: Array.isArray(d?.reviews) ? d.reviews : [],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const submit = async () => {
    if (!user || !content.trim()) return;
    setSubmitting(true);
    setStatus('');
    try {
      const res = await fetch(`${API_BASE}/course-reviews`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ courseId, rating, content, isAnonymous }),
      });
      const d = await res.json();
      if (!res.ok) {
        setStatus(d.error || '提交失败');
      } else {
        setStatus('评价提交成功，待管理员审核后展示');
        setContent('');
        setIsAnonymous(false);
      }
    } catch {
      setStatus('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[21px] font-semibold text-[#1d1d1f]">课程评价</h3>
        <div className="text-right">
          <p className="text-[24px] font-semibold text-[#0071e3]">{data.ratingAvg.toFixed(1)}</p>
          <p className="text-[13px] text-[#86868b]">{data.reviewCount} 条评价</p>
        </div>
      </div>

      {user ? (
        <div className="mb-6 p-4 bg-[#f5f5f7] rounded-xl">
          <div className="flex flex-wrap gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => setRating(v)}
                className={`w-10 h-10 rounded-full text-sm font-medium ${rating === v ? 'bg-[#0071e3] text-white' : 'bg-white text-[#86868b]'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="写下你对这门课程的评价..."
            className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <label className="text-sm text-[#86868b] flex items-center gap-2">
              <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
              匿名发表
            </label>
            <button
              onClick={submit}
              disabled={submitting || !content.trim()}
              className="px-6 py-2.5 rounded-[980px] bg-[#0071e3] text-white text-[15px] font-medium hover:bg-[#0077ed] disabled:opacity-50"
            >
              {submitting ? '提交中...' : '提交评价'}
            </button>
          </div>
          {status && <p className={`mt-2 text-sm ${status.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>{status}</p>}
        </div>
      ) : (
        <p className="mb-6 text-[#86868b]">
          请先 <Link href="/login" className="text-[#0071e3] hover:underline">登录</Link> 后发表课程评价。
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.reviews.length === 0 ? (
        <p className="text-center text-[#86868b] py-8">暂无课程评价</p>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((r) => (
            <div key={r.id} className="p-4 bg-[#f5f5f7] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[14px] font-medium ${r.isAnonymous ? 'text-[#86868b] italic' : 'text-[#1d1d1f]'}`}>{r.userName}</span>
                  <span className="text-[12px] text-[#0071e3]">评分 {r.rating}/5</span>
                </div>
                <span className="text-[12px] text-[#86868b]">{new Date(r.createdAt).toLocaleDateString('zh-CN')}</span>
              </div>
              <p className="text-[15px] text-[#1d1d1f] leading-relaxed">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

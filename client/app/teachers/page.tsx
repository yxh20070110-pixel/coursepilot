'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE } from '@/lib/api';
import LikeButton from '@/components/LikeButton';

interface Teacher {
  _id: string;
  name: string;
  title: string;
  department: string;
  reviewCount: number;
  courseCount: number;
  likeCount: number;
  liked?: boolean;
}

function TeachersContent() {
  const searchParams = useSearchParams();
  const sortPopular = searchParams.get('sort') === 'popular';
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (sortPopular) params.set('sort', 'popular');
      fetch(`${API_BASE}/teachers?${params}`)
        .then((r) => r.json())
        .then((data) => { setTeachers(data); setLoading(false); })
        .catch(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, sortPopular]);

  return (
    <div className="max-w-[980px] mx-auto px-6 py-16">
      <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">
        {sortPopular ? '热门教师排行榜' : '教师'}
      </h1>
      <p className="mt-3 text-[17px] text-[#86868b]">
        {sortPopular ? '按点赞数量排序' : '查看教师信息、评分与评论'}
      </p>
      <div className="mt-6 flex flex-wrap gap-4 items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索教师姓名..."
          className="flex-1 min-w-[200px] max-w-md px-5 py-3 bg-[#f5f5f7] rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 text-[17px]"
        />
        <Link
          href={sortPopular ? '/teachers' : '/teachers?sort=popular'}
          className="text-[15px] text-[#0071e3] hover:underline font-medium"
        >
          {sortPopular ? '按默认排序' : '按点赞排序'}
        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((teacher) => (
            <div key={teacher._id} className="group p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
              <Link href={`/teachers/${teacher._id}`} className="block">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0071e3] to-[#00c7be] flex items-center justify-center text-white text-xl font-semibold flex-shrink-0">
                    {teacher.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[19px] font-semibold text-[#1d1d1f] truncate group-hover:text-[#0071e3] transition-colors">{teacher.name}</h3>
                    <p className="text-[14px] text-[#86868b]">{teacher.title} · {teacher.department}</p>
                  </div>
                </div>
              </Link>
              <div className="mt-4 flex items-center justify-between" onClick={(e) => e.preventDefault()}>
                <LikeButton teacherId={teacher._id} likeCount={teacher.likeCount || 0} liked={teacher.liked} />
                <span className="text-[14px] text-[#86868b]">{teacher.courseCount || 0} 门课 · {teacher.reviewCount || 0} 条评价</span>
              </div>
            </div>
          ))}
          {teachers.length === 0 && (
            <div className="col-span-full text-center py-16 text-[#86868b] text-[17px]">
              {search ? '未找到匹配的教师' : '暂无教师数据'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeachersPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[980px] mx-auto px-6 py-16 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TeachersContent />
    </Suspense>
  );
}

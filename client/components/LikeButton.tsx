'use client';

import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { API_BASE, authHeaders } from '@/lib/api';
import Link from 'next/link';

interface LikeButtonProps {
  teacherId: string;
  likeCount: number;
  liked?: boolean;
  onToggle?: (liked: boolean, count: number) => void;
  compact?: boolean;
}

export default function LikeButton({ teacherId, likeCount: initialCount, liked: initialLiked = false, onToggle, compact }: LikeButtonProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/teachers/${teacherId}/like`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setLiked(data.liked);
        setCount(data.likeCount);
        onToggle?.(data.liked, data.likeCount);
      }
    } catch {}
    setLoading(false);
  };

  const content = (
    <span className="inline-flex items-center gap-1">
      <svg className={`w-[18px] h-[18px] ${liked ? 'fill-red-500' : 'fill-none stroke-current'}`} strokeWidth={1.5} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
      {!compact && <span>{count}</span>}
    </span>
  );

  if (!user) {
    return (
      <Link href="/login" className={`inline-flex items-center gap-1 text-[#86868b] hover:text-[#1d1d1f] transition-colors ${compact ? 'text-sm' : ''}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1 transition-colors disabled:opacity-50 ${liked ? 'text-red-500' : 'text-[#86868b] hover:text-red-500'} ${compact ? 'text-sm' : ''}`}
    >
      {content}
    </button>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { API_BASE, SERVER_BASE, getToken } from '@/lib/api';
import { useAuth } from '@/app/providers';
import Link from 'next/link';

interface Photo {
  id: string;
  imageUrl: string;
  caption: string;
  userName: string;
  createdAt: string;
}

interface PhotoWallProps {
  type: 'course' | 'teacher';
  targetId: string;
  title?: string;
}

export default function PhotoWall({ type, targetId, title }: PhotoWallProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<string>('');

  const fetchPhotos = () => {
    fetch(`${API_BASE}/photos/${type}/${targetId}`)
      .then((r) => r.json())
      .then((d) => { setPhotos(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPhotos();
  }, [type, targetId]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    setUploading(true);
    setStatus('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('caption', caption);

      const res = await fetch(`${API_BASE}/photos/${type}/${targetId}`, {
        method: 'POST',
        headers: {
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || '上传失败');
      } else {
        setStatus('上传成功');
        setCaption('');
        fetchPhotos();
      }
    } catch {
      setStatus('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8">
      <h3 className="text-[21px] font-semibold text-[#1d1d1f] mb-6">
        {title || (type === 'course' ? '课程照片墙' : '教师照片墙')}
      </h3>

      {user ? (
        <div className="mb-6 p-4 bg-[#f5f5f7] rounded-xl">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="图片说明（如：板书重点、课堂大纲）"
              className="flex-1 px-4 py-2.5 bg-white rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
            />
            <label className="inline-flex items-center justify-center px-5 py-2.5 rounded-[980px] bg-[#0071e3] text-white text-[15px] font-medium hover:bg-[#0077ed] cursor-pointer transition">
              {uploading ? '上传中...' : '上传照片'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>
          </div>
          {status && <p className={`mt-2 text-sm ${status.includes('成功') ? 'text-green-600' : 'text-red-600'}`}>{status}</p>}
        </div>
      ) : (
        <p className="mb-6 text-[#86868b]">
          请先 <Link href="/login" className="text-[#0071e3] hover:underline">登录</Link> 后上传照片。
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#86868b] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <p className="text-center text-[#86868b] py-8">暂无照片，上传第一张课堂照片吧。</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="bg-[#f5f5f7] rounded-xl overflow-hidden">
              <img
                src={`${SERVER_BASE}${photo.imageUrl}`}
                alt={photo.caption || '课堂照片'}
                className="w-full h-44 object-cover"
              />
              <div className="p-3">
                <p className="text-[14px] text-[#1d1d1f] line-clamp-2">{photo.caption || '无说明'}</p>
                <div className="mt-2 text-[12px] text-[#86868b] flex justify-between">
                  <span>{photo.userName}</span>
                  <span>{new Date(photo.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

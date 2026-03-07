'use client';

import { useParams } from 'next/navigation';
import TeacherRatingBlock from '@/components/TeacherRatingBlock';
import PhotoWall from '@/components/PhotoWall';

export default function TeacherDetailPage() {
  const params = useParams();
  const teacherId = params.id as string;

  return (
    <div className="max-w-[980px] mx-auto px-6 py-16 space-y-8">
      <TeacherRatingBlock teacherId={teacherId} />
      <PhotoWall type="teacher" targetId={teacherId} title="教师照片墙（板书/课堂内容）" />
    </div>
  );
}

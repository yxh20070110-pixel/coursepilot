import './globals.css';
import { AuthProvider } from './providers';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: '课星 CoursePilot - 高校选课与教师评价平台',
  description: '课星 CoursePilot，让选课更简单。浏览课程、查看教师评分、选课避坑，一站搞定。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/providers';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links = [
    { href: '/', label: '首页' },
    { href: '/courses', label: '课程' },
    { href: '/teachers', label: '教师' },
    { href: '/enroll', label: '选课' },
    { href: '/profile', label: '个人中心' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-[980px] mx-auto px-6 flex justify-between h-[64px] items-center">
        <Link href="/" className="group flex items-center gap-3 hover:opacity-90 transition-all duration-200">
          <Image
            src="/logo.png"
            alt="课星 Logo"
            width={36}
            height={36}
            className="rounded-md shadow-sm transition-transform duration-200 group-hover:scale-105"
          />
          <span className="leading-tight">
            <span className="block text-[18px] font-semibold text-[#1d1d1f] tracking-tight">课星</span>
            <span className="block text-[11px] text-[#86868b] -mt-0.5">CoursePilot</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[14px] font-normal transition-all duration-200 hover:-translate-y-0.5 ${
                pathname === link.href ? 'text-[#1d1d1f]' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link href="/admin" className="text-[14px] text-[#86868b] hover:text-red-600 transition-all duration-200 hover:-translate-y-0.5">
              管理
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-[13px] text-[#86868b]">{user.name}</span>
              <button onClick={logout} className="text-[13px] text-[#0071e3] hover:underline transition-all duration-200 hover:-translate-y-0.5">
                退出
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[13px] text-[#0071e3] hover:underline transition-all duration-200 hover:-translate-y-0.5">登录</Link>
              <Link href="/register" className="text-[13px] text-white bg-[#0071e3] px-4 py-2 rounded-[980px] hover:bg-[#0077ed] transition-all duration-200 hover:-translate-y-0.5">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/', label: '首页' },
    { href: '/courses', label: '课程' },
    { href: '/teachers', label: '教师' },
    { href: '/enroll', label: '选课' },
    { href: '/profile', label: '个人中心' },
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-[980px] mx-auto px-4 md:px-6 flex justify-between h-[64px] items-center">
        <Link href="/" className="group flex items-center hover:opacity-90 transition-all duration-200">
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
        <div className="hidden md:flex items-center gap-4">
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

        <button
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 text-[#1d1d1f]"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="切换菜单"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-lg text-[15px] ${
                  pathname === link.href ? 'bg-[#f5f5f7] text-[#1d1d1f] font-medium' : 'text-[#4b4b50]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user?.role === 'admin' && (
              <Link href="/admin" className="block px-3 py-2 rounded-lg text-[15px] text-[#4b4b50]">
                管理
              </Link>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
            {user ? (
              <>
                <span className="text-[13px] text-[#86868b] truncate">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-[13px] text-[#0071e3] px-3 py-2 rounded-lg border border-[#0071e3]/20"
                >
                  退出
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Link href="/login" className="flex-1 text-center text-[14px] text-[#0071e3] border border-[#0071e3]/20 px-3 py-2 rounded-lg">
                  登录
                </Link>
                <Link href="/register" className="flex-1 text-center text-[14px] text-white bg-[#0071e3] px-3 py-2 rounded-lg">
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

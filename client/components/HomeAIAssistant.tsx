'use client';

import { useState } from 'react';
import { API_BASE, authHeaders } from '@/lib/api';
import { useAuth } from '@/app/providers';
import Link from 'next/link';

type JumpLink = { label: string; href: string };
type Msg = { role: 'user' | 'assistant'; text: string; links?: JumpLink[] };

const QUICK_QUESTIONS = [
  '刘教授怎么样？',
  '高等数学怎么样？',
  '推荐一个讲解清晰、给分友好的计算机老师',
  '数据库原理这门课口碑如何？',
];

export default function HomeAIAssistant() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: '你好，我是课星 AI。你可以问“某位老师怎么样”或“某门课程怎么样”，我会基于同学评价做总结。' },
  ]);

  const send = async (preset?: string) => {
    const q = (preset ?? input).trim();
    if (!q || !user || sending) return;
    if (!preset) setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'assistant', text: data.answer || '暂时无法回答，请稍后再试。', links: Array.isArray(data.links) ? data.links : [] }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: '网络异常，请稍后再试。' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="py-20 px-6">
      <div className="max-w-[980px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-[32px] md:text-[40px] font-bold text-[#1d1d1f] tracking-tight">AI 选课顾问</h2>
          <p className="mt-3 text-[17px] text-[#86868b]">
            直接搜索老师或课程口碑。AI 会基于同学评论和评分，输出课程评价与教师特点总结。
          </p>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white shadow-xl shadow-gray-100/70 overflow-hidden animate-fade-in-up">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-medium text-[#1d1d1f]">CoursePilot AI</span>
            <span className="text-xs text-gray-400">评论驱动总结</span>
          </div>

          <div className="p-5 border-b border-gray-100 flex flex-wrap gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={!user || sending}
                className="px-3 py-2 rounded-full text-sm bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e9e9ec] disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="h-80 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-white to-[#fafafa]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm px-4 py-3 rounded-2xl whitespace-pre-line ${
                  msg.role === 'assistant'
                    ? 'bg-[#f5f5f7] text-[#1d1d1f] mr-10'
                    : 'bg-[#0071e3] text-white ml-10'
                }`}
              >
                {msg.text}
                {msg.role === 'assistant' && Array.isArray(msg.links) && msg.links.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.links.map((link) => (
                      <Link
                        key={`${link.href}-${link.label}`}
                        href={link.href}
                        className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-white border border-gray-200 text-[#0071e3] hover:bg-[#f5f5f7] transition-all duration-200 hover:-translate-y-0.5"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {!user && (
              <p className="text-xs text-gray-400">
                登录后可使用 AI 问答。
              </p>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="比如：高等数学怎么样？或者推荐一个讲解清晰的计算机老师"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
            />
            <button
              onClick={() => send()}
              disabled={!user || sending || !input.trim()}
              className="px-5 py-3 bg-[#0071e3] text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-all duration-200 hover:bg-[#0077ed] hover:-translate-y-0.5"
            >
              {sending ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

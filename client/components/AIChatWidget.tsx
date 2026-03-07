'use client';

import { useState } from 'react';
import { API_BASE, authHeaders } from '@/lib/api';
import { useAuth } from '@/app/providers';

type Msg = { role: 'user' | 'assistant'; text: string };

export default function AIChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: '你好，我是课星 AI 助手。你可以问我选课冲突、学分规划和课程推荐。' },
  ]);

  const send = async () => {
    if (!input.trim() || !user || sending) return;
    const q = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: q }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'assistant', text: data.answer || '暂时无法回答，请稍后再试。' }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: '网络异常，请稍后再试。' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-[#0071e3] text-white px-5 py-3 shadow-lg hover:bg-[#0077ed]"
      >
        AI 助手
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 w-[360px] max-w-[90vw] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-medium text-[#1d1d1f]">课星 AI</span>
            <span className="text-xs text-gray-400">mock</span>
          </div>
          <div className="h-72 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`text-sm px-3 py-2 rounded-xl ${msg.role === 'assistant' ? 'bg-gray-100 text-gray-700' : 'bg-[#0071e3] text-white ml-10'}`}>
                {msg.text}
              </div>
            ))}
            {!user && <p className="text-xs text-gray-400">登录后可使用 AI 对话。</p>}
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder="输入你的问题..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30"
            />
            <button
              onClick={send}
              disabled={!user || sending || !input.trim()}
              className="px-3 py-2 bg-[#0071e3] text-white rounded-lg text-sm disabled:opacity-50"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}

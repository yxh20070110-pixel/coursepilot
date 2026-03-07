'use client';

import Link from 'next/link';

export default function DisclaimerPage() {
  return (
    <div className="max-w-[720px] mx-auto px-6 py-20">
      <h1 className="text-[40px] font-semibold text-[#1d1d1f] tracking-tight">免责声明</h1>
      <p className="mt-4 text-[15px] text-[#86868b]">最后更新日期：2024年</p>

      <div className="mt-12 space-y-8 text-[17px] text-[#1d1d1f] leading-relaxed">
        <section>
          <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">1. 用户评论与内容</h2>
          <p>本平台所有评论、评分及用户生成内容均为用户个人观点，不代表本平台立场。课星不对用户发布内容的真实性、准确性、合法性承担责任。</p>
        </section>

        <section>
          <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">2. 平台责任限制</h2>
          <p>本平台仅提供信息展示与交流服务，不承担因用户内容引发的任何直接或间接责任。用户应自行判断信息可靠性，并承担使用本平台服务所产生的风险。</p>
        </section>

        <section>
          <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">3. 禁止行为</h2>
          <p>用户不得在本平台发布侮辱、诽谤、恶意攻击他人或机构的言论。禁止发布违法、违规、虚假或侵权内容。违者将承担相应法律责任。</p>
        </section>

        <section>
          <h2 className="text-[21px] font-semibold text-[#1d1d1f] mb-4">4. 内容管理</h2>
          <p>管理员有权对违规内容进行删除、屏蔽或采取其他必要措施，无需事先通知。用户若对处理结果有异议，可通过平台提供的渠道进行申诉。</p>
        </section>

        <section>
          <p className="text-[15px] text-[#86868b]">
            使用本平台即表示您已阅读并同意以上条款。如有疑问，请联系平台管理员。
          </p>
        </section>
      </div>

      <div className="mt-16">
        <Link href="/" className="text-[#0071e3] text-[17px] font-medium hover:underline">
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}

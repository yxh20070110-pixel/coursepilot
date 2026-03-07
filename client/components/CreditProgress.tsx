'use client';

interface CreditProgressProps {
  earnedCredits: number;
  requiredCredits: number;
  percentage: number;
}

export default function CreditProgress({ earnedCredits, requiredCredits, percentage }: CreditProgressProps) {
  const clampedPct = Math.min(percentage, 100);

  return (
    <div className="w-full">
      <div className="flex justify-between mb-4">
        <span className="text-[15px] font-medium text-[#1d1d1f]">已修 {earnedCredits} / {requiredCredits} 学分</span>
        <span className="text-[15px] font-medium text-[#0071e3]">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-[#e8e8ed] rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-700 ease-out bg-[#0071e3]"
          style={{ width: `${clampedPct}%` }}
        />
      </div>
    </div>
  );
}

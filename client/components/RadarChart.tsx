'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface RadarChartProps {
  data: {
    teachingQuality: number;
    workload: number;
    gradingFairness: number;
    difficulty: number;
  };
}

export default function RadarChart({ data }: RadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      color: ['#3b82f6'],
      radar: {
        indicator: [
          { name: '教学质量', max: 5 },
          { name: '作业量', max: 5 },
          { name: '给分公平', max: 5 },
          { name: '课程难度', max: 5 },
        ],
        shape: 'circle',
        splitNumber: 5,
        axisName: {
          color: '#4b5563',
          fontSize: 13,
          fontWeight: 500,
        },
        splitArea: {
          areaStyle: { color: ['rgba(59,130,246,0.02)', 'rgba(59,130,246,0.04)'] },
        },
        splitLine: {
          lineStyle: { color: '#e5e7eb' },
        },
        axisLine: {
          lineStyle: { color: '#d1d5db' },
        },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [
                Math.round(data.teachingQuality * 10) / 10,
                Math.round(data.workload * 10) / 10,
                Math.round(data.gradingFairness * 10) / 10,
                Math.round(data.difficulty * 10) / 10,
              ],
              name: '平均评分',
              areaStyle: { color: 'rgba(59,130,246,0.15)' },
              lineStyle: { color: '#3b82f6', width: 2 },
              itemStyle: { color: '#3b82f6' },
            },
          ],
        },
      ],
      tooltip: {
        trigger: 'item',
      },
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [data]);

  return <div ref={chartRef} className="w-full h-[380px]" />;
}

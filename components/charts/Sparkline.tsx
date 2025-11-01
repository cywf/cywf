'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export default function Sparkline({ data, color = '#2AFD7B', height = 60 }: SparklineProps) {
  const option: EChartsOption = {
    grid: {
      left: 0,
      right: 0,
      top: 5,
      bottom: 5,
    },
    xAxis: {
      type: 'category',
      show: false,
      data: data.map((_, i) => i),
    },
    yAxis: {
      type: 'value',
      show: false,
      min: Math.min(...data) * 0.9,
      max: Math.max(...data) * 1.1,
    },
    series: [
      {
        type: 'line',
        data: data,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: color,
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: `${color}40`,
              },
              {
                offset: 1,
                color: `${color}10`,
              },
            ],
          },
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

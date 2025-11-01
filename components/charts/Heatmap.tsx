'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface HeatmapProps {
  data: Array<[string, number]>; // [date, value]
  title?: string;
}

export default function Heatmap({ data, title }: HeatmapProps) {
  // Process data for calendar heatmap
  const values = data.map((item) => item[1]);
  const maxValue = Math.max(...values, 1);

  const option: EChartsOption = {
    title: title
      ? {
          text: title,
          left: 'center',
          textStyle: {
            color: '#e7f7ee',
            fontSize: 14,
          },
        }
      : undefined,
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        return `${params.data[0]}<br/>Contributions: ${params.data[1]}`;
      },
      backgroundColor: '#0f1616',
      borderColor: 'rgba(58, 255, 129, 0.20)',
      textStyle: {
        color: '#e7f7ee',
      },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: 'bottom',
      inRange: {
        color: ['#0f1616', '#9CFFBF', '#2AFD7B'],
      },
      textStyle: {
        color: '#a6cbb7',
      },
    },
    calendar: {
      top: 60,
      left: 30,
      right: 30,
      cellSize: ['auto', 13],
      range: new Date().getFullYear(),
      itemStyle: {
        borderWidth: 1,
        borderColor: 'rgba(58, 255, 129, 0.20)',
      },
      yearLabel: { show: true, color: '#e7f7ee' },
      monthLabel: { color: '#a6cbb7' },
      dayLabel: { color: '#a6cbb7' },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(58, 255, 129, 0.10)',
          width: 1,
        },
      },
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data,
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '250px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

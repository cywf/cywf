'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface ActivityByHourChartProps {
  data: Array<{ hour: number; count: number }>;
  title?: string;
}

export default function ActivityByHourChart({ data, title }: ActivityByHourChartProps) {
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
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      backgroundColor: '#0f1616',
      borderColor: 'rgba(58, 255, 129, 0.20)',
      textStyle: {
        color: '#e7f7ee',
      },
      formatter: (params: any) => {
        const param = Array.isArray(params) ? params[0] : params;
        return `${param.name}:00 UTC<br/>${param.value} contributions`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: title ? 50 : 30,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((item) => item.hour.toString()),
      axisLabel: {
        color: '#a6cbb7',
        formatter: (value: string) => `${value}:00`,
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(58, 255, 129, 0.20)',
        },
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: 'rgba(58, 255, 129, 0.10)',
        },
      },
      axisLabel: {
        color: '#a6cbb7',
      },
    },
    series: [
      {
        type: 'bar',
        data: data.map((item, index) => ({
          value: item.count,
          itemStyle: {
            // Alternate between two shades for better readability
            color: index % 2 === 0 ? '#2AFD7B' : '#1FD96A',
            borderRadius: [4, 4, 0, 0],
          },
        })),
        emphasis: {
          itemStyle: {
            color: '#9CFFBF',
          },
        },
        barWidth: '85%',
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '300px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

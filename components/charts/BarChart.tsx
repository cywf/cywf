'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  horizontal?: boolean;
}

export default function BarChart({ data, title, horizontal = false }: BarChartProps) {
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
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: title ? 50 : 30,
      containLabel: true,
    },
    xAxis: horizontal
      ? {
          type: 'value',
          splitLine: {
            lineStyle: {
              color: 'rgba(58, 255, 129, 0.10)',
            },
          },
          axisLabel: {
            color: '#a6cbb7',
          },
        }
      : {
          type: 'category',
          data: data.map((item) => item.name),
          axisLabel: {
            color: '#a6cbb7',
            rotate: data.length > 10 ? 45 : 0,
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(58, 255, 129, 0.20)',
            },
          },
        },
    yAxis: horizontal
      ? {
          type: 'category',
          data: data.map((item) => item.name),
          axisLabel: {
            color: '#a6cbb7',
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(58, 255, 129, 0.20)',
            },
          },
        }
      : {
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
        data: data.map((item) => item.value),
        itemStyle: {
          color: '#2AFD7B',
          borderRadius: horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: '#9CFFBF',
          },
        },
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

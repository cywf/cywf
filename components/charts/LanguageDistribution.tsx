'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface LanguageDistributionProps {
  data: Array<{ name: string; color: string; kb: number }>;
  title?: string;
}

export default function LanguageDistribution({ data, title }: LanguageDistributionProps) {
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
        return `${param.name}<br/>Weight: ${param.value}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: title ? 70 : 50,
      containLabel: true,
    },
    legend: {
      data: data.map((item) => item.name),
      type: 'scroll',
      orient: 'horizontal',
      top: title ? 30 : 10,
      textStyle: {
        color: '#a6cbb7',
      },
      itemWidth: 14,
      itemHeight: 14,
    },
    xAxis: {
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
    yAxis: {
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
    },
    series: [
      {
        type: 'bar',
        data: data.map((item) => ({
          value: item.kb,
          itemStyle: {
            color: item.color,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(42, 253, 123, 0.5)',
          },
        },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '320px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

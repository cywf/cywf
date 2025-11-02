'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  colors?: string[];
}

export default function DonutChart({ data, title, colors }: DonutChartProps) {
  const defaultColors = ['#2AFD7B', '#3AFF81', '#1FD96A'];

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
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)',
      backgroundColor: '#0f1616',
      borderColor: 'rgba(58, 255, 129, 0.20)',
      textStyle: {
        color: '#e7f7ee',
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      textStyle: {
        color: '#a6cbb7',
      },
      itemWidth: 14,
      itemHeight: 14,
    },
    series: [
      {
        name: 'Activity',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#0a1111',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}%',
          color: '#e7f7ee',
          fontSize: 12,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(42, 253, 123, 0.5)',
          },
        },
        labelLine: {
          show: true,
          lineStyle: {
            color: '#a6cbb7',
          },
        },
        data: data.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: colors ? colors[index % colors.length] : defaultColors[index % defaultColors.length],
          },
        })),
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

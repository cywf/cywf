'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface StackedBarChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      name: string;
      data: number[];
      color: string;
    }>;
  };
  title?: string;
}

export default function StackedBarChart({ data, title }: StackedBarChartProps) {
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
    legend: {
      data: data.datasets.map((ds) => ds.name),
      textStyle: {
        color: '#a6cbb7',
      },
      top: title ? 30 : 10,
      itemWidth: 14,
      itemHeight: 14,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: title ? 70 : 50,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.labels,
      axisLabel: {
        color: '#a6cbb7',
        rotate: data.labels.length > 8 ? 45 : 0,
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(58, 255, 129, 0.20)',
        },
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
    series: data.datasets.map((dataset) => ({
      name: dataset.name,
      type: 'bar',
      stack: 'total',
      data: dataset.data,
      itemStyle: {
        color: dataset.color,
      },
      emphasis: {
        focus: 'series',
      },
    })),
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '320px', width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}

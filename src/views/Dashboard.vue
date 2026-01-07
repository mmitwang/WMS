<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.title">
        <div class="stat-icon">
          <el-icon><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-title">{{ stat.title }}</div>
          <div class="stat-change" :class="stat.changeType">
            <el-icon><component :is="stat.changeIcon" /></el-icon>
            {{ stat.change }}
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <h3>库存健康度</h3>
        </div>
        <div ref="healthChart" class="chart-container"></div>
      </div>
      
      <div class="chart-card">
        <div class="chart-header">
          <h3>库区吞吐量</h3>
        </div>
        <div ref="throughputChart" class="chart-container"></div>
      </div>
      
      <div class="chart-card large">
        <div class="chart-header">
          <h3>实时作业轨迹</h3>
        </div>
        <div ref="trajectoryChart" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const healthChart = ref(null)
const throughputChart = ref(null)
const trajectoryChart = ref(null)

let healthChartInstance = null
let throughputChartInstance = null
let trajectoryChartInstance = null

const stats = ref([
  {
    title: '总库存量',
    value: '15,420',
    change: '+5.2%',
    changeType: 'positive',
    changeIcon: 'ArrowUp',
    icon: 'Box'
  },
  {
    title: '今日入库',
    value: '156',
    change: '+12.8%',
    changeType: 'positive',
    changeIcon: 'ArrowUp',
    icon: 'Download'
  },
  {
    title: '今日出库',
    value: '89',
    change: '-3.2%',
    changeType: 'negative',
    changeIcon: 'ArrowDown',
    icon: 'Upload'
  },
  {
    title: '库存周转率',
    value: '78.5%',
    change: '+2.1%',
    changeType: 'positive',
    changeIcon: 'ArrowUp',
    icon: 'Refresh'
  }
])

onMounted(() => {
  initCharts()
})

onUnmounted(() => {
  if (healthChartInstance) healthChartInstance.dispose()
  if (throughputChartInstance) throughputChartInstance.dispose()
  if (trajectoryChartInstance) trajectoryChartInstance.dispose()
})

const initCharts = () => {
  // 库存健康度环形图
  healthChartInstance = echarts.init(healthChart.value)
  healthChartInstance.setOption({
    backgroundColor: 'transparent',
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '50%'],
      data: [
        { value: 78.5, name: '健康', itemStyle: { color: '#00FFFF' } },
        { value: 21.5, name: '异常', itemStyle: { color: '#FF3300' } }
      ],
      label: { color: '#fff' },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,255,255,0.5)' } }
    }]
  })

  // 库区吞吐量柱状图
  throughputChartInstance = echarts.init(throughputChart.value)
  throughputChartInstance.setOption({
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 40, left: 40 },
    xAxis: {
      type: 'category',
      data: ['A区', 'B区', 'C区', 'D区'],
      axisLine: { lineStyle: { color: '#00FFFF' } },
      axisLabel: { color: '#fff' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#00FFFF' } },
      axisLabel: { color: '#fff' },
      splitLine: { lineStyle: { color: 'rgba(0,255,255,0.2)' } }
    },
    series: [{
      type: 'bar',
      data: [120, 200, 150, 80],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#00FFFF' },
          { offset: 1, color: '#FF3300' }
        ])
      }
    }]
  })

  // 实时作业轨迹折线图
  trajectoryChartInstance = echarts.init(trajectoryChart.value)
  trajectoryChartInstance.setOption({
    backgroundColor: 'transparent',
    grid: { top: 20, right: 20, bottom: 40, left: 40 },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
      axisLine: { lineStyle: { color: '#00FFFF' } },
      axisLabel: { color: '#fff' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#00FFFF' } },
      axisLabel: { color: '#fff' },
      splitLine: { lineStyle: { color: 'rgba(0,255,255,0.2)' } }
    },
    series: [{
      type: 'line',
      data: [20, 45, 80, 120, 95, 60],
      smooth: true,
      lineStyle: { color: '#00FFFF', width: 3 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(0,255,255,0.3)' },
          { offset: 1, color: 'rgba(0,255,255,0.1)' }
        ])
      }
    }]
  })
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';

.dashboard {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);
  }

  .stat-card {
    @include glass-effect;
    padding: var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    transition: all var(--transition-normal) ease;

    &:hover {
      @include cyber-glow;
      transform: translateY(-4px);
    }

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--gradient-cyber);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: var(--text-primary);
    }

    .stat-content {
      flex: 1;

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1;
      }

      .stat-title {
        font-size: 14px;
        color: var(--text-secondary);
        margin: 4px 0;
      }

      .stat-change {
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 4px;

        &.positive {
          color: var(--text-success);
        }

        &.negative {
          color: var(--text-danger);
        }
      }
    }
  }

  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);

    .chart-card {
      @include glass-effect;
      padding: var(--spacing-lg);
      height: 400px;

      &.large {
        grid-column: 1 / -1;
        height: 300px;
      }

      .chart-header {
        margin-bottom: var(--spacing-md);

        h3 {
          color: var(--text-primary);
          font-size: 18px;
          margin: 0;
        }
      }

      .chart-container {
        width: 100%;
        height: calc(100% - 60px);
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .charts-grid {
      grid-template-columns: 1fr;

      .chart-card.large {
        grid-column: 1;
      }
    }
  }
}
</style>

<template>
  <div class="glassmorphism-dashboard">
    <!-- 页面标题 -->
    <div class="dashboard-header glass-panel fade-in-up">
      <h1 class="dashboard-title">
        <i class="el-icon-data-line"></i>
        腾腾电气仪表盘
      </h1>
      <div class="dashboard-time">{{ currentTime }}</div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stats-card fade-in-up" v-for="(stat, index) in stats" :key="stat.title" :style="{ animationDelay: `${index * 0.1}s` }">
        <div class="stats-icon">
          <el-icon><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stats-number">{{ stat.value }}</div>
        <div class="stats-label">{{ stat.title }}</div>
        <div class="stats-trend" :class="stat.changeType">
          <el-icon><component :is="stat.changeIcon" /></el-icon>
          {{ stat.change }}
        </div>
        <div class="liquid-progress" v-if="stat.showProgress">
          <div class="progress-fill" :style="{ width: stat.progress + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <div class="glass-chart fade-in-up">
        <div class="chart-title">
          <i class="el-icon-pie-chart"></i>
          库存健康度
          <div class="floating-tag">实时监控</div>
        </div>
        <div class="chart-container">
          <div ref="healthChart" class="chart"></div>
        </div>
      </div>
      
      <div class="glass-chart fade-in-up" style="animation-delay: 0.2s">
        <div class="chart-title">
          <i class="el-icon-histogram"></i>
          库区容积量
          <div class="floating-tag">动态更新</div>
        </div>
        <div class="chart-container">
          <div ref="volumeChart" class="chart"></div>
        </div>
      </div>
      
      <div class="glass-chart large fade-in-up" style="animation-delay: 0.4s">
        <div class="chart-title">
          <i class="el-icon-data-line"></i>
          实时作业轨迹
          <div class="floating-tag">24小时监控</div>
        </div>
        <div class="chart-container">
          <div ref="trajectoryChart" class="chart"></div>
        </div>
      </div>
    </div>

    <!-- 快捷操作面板 -->
    <div class="quick-actions glass-panel fade-in-up" style="animation-delay: 0.6s">
      <h3>快捷操作</h3>
      <div class="actions-grid">
        <button class="business-btn primary" @click="handleQuickAction('inbound')">
          <i class="el-icon-download"></i>
          快速入库
        </button>
        <button class="business-btn success" @click="handleQuickAction('outbound')">
          <i class="el-icon-upload2"></i>
          快速出库
        </button>
        <button class="business-btn warning" @click="handleQuickAction('inventory')">
          <i class="el-icon-document"></i>
          库存盘点
        </button>
        <button class="business-btn" @click="handleQuickAction('report')">
          <i class="el-icon-data-analysis"></i>
          生成报表
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const healthChart = ref(null)
const volumeChart = ref(null)
const trajectoryChart = ref(null)
const currentTime = ref('')

let healthChartInstance = null
let volumeChartInstance = null
let trajectoryChartInstance = null
let timeInterval = null

const stats = ref([
  {
    title: '总库存量',
    value: '15,420',
    change: '+5.2%',
    changeType: 'up',
    changeIcon: 'ArrowUp',
    icon: 'Box',
    showProgress: true,
    progress: 78
  },
  {
    title: '今日入库',
    value: '156',
    change: '+12.8%',
    changeType: 'up',
    changeIcon: 'ArrowUp',
    icon: 'Download',
    showProgress: true,
    progress: 65
  },
  {
    title: '今日出库',
    value: '89',
    change: '-3.2%',
    changeType: 'down',
    changeIcon: 'ArrowDown',
    icon: 'Upload',
    showProgress: true,
    progress: 45
  },
  {
    title: '预警数量',
    value: '3',
    change: '+2.1%',
    changeType: 'up',
    changeIcon: 'ArrowUp',
    icon: 'Warning',
    showProgress: false,
    progress: 0
  }
])

onMounted(() => {
  initCharts()
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (healthChartInstance) healthChartInstance.dispose()
  if (volumeChartInstance) volumeChartInstance.dispose()
  if (trajectoryChartInstance) trajectoryChartInstance.dispose()
  if (timeInterval) clearInterval(timeInterval)
})

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const initCharts = () => {
  // 库存健康度环形图
  healthChartInstance = echarts.init(healthChart.value)
  healthChartInstance.setOption({
    backgroundColor: 'transparent',
    series: [{
      type: 'pie',
      radius: ['50%', '80%'],
      center: ['50%', '50%'],
      data: [
        { 
          value: 78.5, 
          name: '正常', 
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#059669' }
            ])
          }
        },
        { 
          value: 15.2, 
          name: '预警', 
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: '#d97706' }
            ])
          }
        },
        { 
          value: 6.3, 
          name: '异常', 
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
              { offset: 0, color: '#ef4444' },
              { offset: 1, color: '#dc2626' }
            ])
          }
        }
      ],
      label: { 
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 14,
        fontWeight: 600
      },
      emphasis: { 
        itemStyle: { 
          shadowBlur: 20, 
          shadowColor: 'rgba(255, 255, 255, 0.3)' 
        } 
      }
    }]
  })

  // 库区容积量柱状图
  volumeChartInstance = echarts.init(volumeChart.value)
  volumeChartInstance.setOption({
    backgroundColor: 'transparent',
    grid: { 
      top: 30, 
      right: 30, 
      bottom: 50, 
      left: 50,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['A区-高压', 'B区-低压', 'C区-控制', 'D区-传感'],
      axisLine: { 
        lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } 
      },
      axisLabel: { 
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { 
        lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } 
      },
      axisLabel: { 
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12
      },
      splitLine: { 
        lineStyle: { 
          color: 'rgba(255, 255, 255, 0.1)',
          type: 'dashed'
        } 
      }
    },
    series: [{
      type: 'bar',
      data: [200, 180, 150, 120],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#3b82f6' },
          { offset: 0.5, color: '#8b5cf6' },
          { offset: 1, color: '#6366f1' }
        ]),
        borderRadius: [8, 8, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(59, 130, 246, 0.5)'
        }
      }
    }]
  })

  // 实时作业轨迹折线图
  trajectoryChartInstance = echarts.init(trajectoryChart.value)
  trajectoryChartInstance.setOption({
    backgroundColor: 'transparent',
    grid: { 
      top: 30, 
      right: 30, 
      bottom: 50, 
      left: 50,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      axisLine: { 
        lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } 
      },
      axisLabel: { 
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLine: { 
        lineStyle: { color: 'rgba(255, 255, 255, 0.3)' } 
      },
      axisLabel: { 
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12
      },
      splitLine: { 
        lineStyle: { 
          color: 'rgba(255, 255, 255, 0.1)',
          type: 'dashed'
        } 
      }
    },
    series: [
      {
        name: '入库量',
        type: 'line',
        data: [20, 45, 80, 120, 95, 60, 40],
        smooth: true,
        lineStyle: { 
          color: '#10b981', 
          width: 3 
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.1)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#10b981' }
      },
      {
        name: '出库量',
        type: 'line',
        data: [15, 35, 70, 100, 85, 55, 35],
        smooth: true,
        lineStyle: { 
          color: '#f59e0b', 
          width: 3 
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
            { offset: 1, color: 'rgba(245, 158, 11, 0.1)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#f59e0b' }
      }
    ],
    legend: {
      data: ['入库量', '出库量'],
      textStyle: { color: 'rgba(255, 255, 255, 0.8)' },
      top: 10
    }
  })
}

const handleQuickAction = (action) => {
  console.log('Quick action:', action)
  // 这里可以添加具体的快捷操作逻辑
}
</script>

<style lang="scss" scoped>
@import '../styles/glassmorphism-business-theme.scss';

.glassmorphism-dashboard {
  padding: 24px;
  min-height: 100vh;

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    padding: 20px 24px;

    .dashboard-title {
      font-size: 28px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;

      i {
        font-size: 32px;
        background: linear-gradient(135deg, var(--business-blue), var(--business-purple));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }

    .dashboard-time {
      font-size: 16px;
      color: var(--text-secondary);
      font-weight: 500;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    margin-bottom: 32px;

    .stats-card {
      @extend .stats-card;
      position: relative;
      cursor: pointer;

      .stats-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--business-blue), var(--business-purple));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;
        margin-bottom: 16px;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
      }

      .liquid-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: var(--glass-primary);
        border-radius: 0 0 16px 16px;
        overflow: hidden;

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--business-blue), var(--business-purple));
          transition: width 2s cubic-bezier(0.4, 0, 0.2, 1);
          animation: liquidFill 2s ease-out;
        }
      }
    }
  }

  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;

    .glass-chart {
      &.large {
        grid-column: 1 / -1;
      }

      .chart-title {
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;

        i {
          font-size: 20px;
          color: var(--business-blue);
        }

        .floating-tag {
          margin-left: auto;
        }
      }

      .chart {
        width: 100%;
        height: 100%;
      }
    }
  }

  .quick-actions {
    padding: 24px;

    h3 {
      color: var(--text-primary);
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 20px 0;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;

      .business-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
        padding: 16px 24px;
        font-size: 14px;

        i {
          font-size: 18px;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .glassmorphism-dashboard {
    .charts-grid {
      grid-template-columns: 1fr;

      .glass-chart.large {
        grid-column: 1;
      }
    }
  }
}

@media (max-width: 768px) {
  .glassmorphism-dashboard {
    padding: 16px;

    .dashboard-header {
      flex-direction: column;
      gap: 16px;
      text-align: center;

      .dashboard-title {
        font-size: 24px;
      }
    }

    .stats-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .quick-actions .actions-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

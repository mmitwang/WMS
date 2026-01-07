<template>
  <div class="report-analysis">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <i class="el-icon-pie-chart"></i>
        报表分析
      </h1>
      <div class="header-actions">
        <el-button type="primary" class="cyber-button" @click="handleExport">
          <i class="el-icon-download"></i>
          导出报表
        </el-button>
        <el-button class="cyber-button-secondary" @click="handleRefresh">
          <i class="el-icon-refresh"></i>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 时间筛选器 -->
    <div class="time-filter">
      <el-form :model="filterForm" inline class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="cyber-date-picker"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item label="报表类型">
          <el-select v-model="filterForm.reportType" placeholder="请选择报表类型" class="cyber-select" @change="handleTypeChange">
            <el-option label="库存分析" value="inventory" />
            <el-option label="出入库统计" value="inout" />
            <el-option label="库区效率" value="efficiency" />
            <el-option label="商品流转" value="turnover" />
          </el-select>
        </el-form-item>
        <el-form-item label="库区">
          <el-select v-model="filterForm.warehouse" placeholder="全部库区" clearable class="cyber-select">
            <el-option label="A区" value="A" />
            <el-option label="B区" value="B" />
            <el-option label="C区" value="C" />
            <el-option label="D区" value="D" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 关键指标卡片 -->
    <div class="kpi-cards">
      <div class="kpi-card">
        <div class="kpi-icon">
          <i class="el-icon-box"></i>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.totalInventory }}</div>
          <div class="kpi-label">总库存量</div>
          <div class="kpi-trend positive">
            <i class="el-icon-top"></i>
            +12.5%
          </div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">
          <i class="el-icon-top-right"></i>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.inboundCount }}</div>
          <div class="kpi-label">入库单数</div>
          <div class="kpi-trend positive">
            <i class="el-icon-top"></i>
            +8.3%
          </div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">
          <i class="el-icon-bottom-left"></i>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.outboundCount }}</div>
          <div class="kpi-label">出库单数</div>
          <div class="kpi-trend negative">
            <i class="el-icon-bottom"></i>
            -3.2%
          </div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">
          <i class="el-icon-odometer"></i>
        </div>
        <div class="kpi-content">
          <div class="kpi-value">{{ kpiData.turnoverRate }}%</div>
          <div class="kpi-label">库存周转率</div>
          <div class="kpi-trend positive">
            <i class="el-icon-top"></i>
            +5.7%
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="chart-row">
        <!-- 库存趋势图 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>库存变化趋势</h3>
            <el-button-group class="chart-controls">
              <el-button size="small" :class="{ active: trendPeriod === 'week' }" @click="changeTrendPeriod('week')">周</el-button>
              <el-button size="small" :class="{ active: trendPeriod === 'month' }" @click="changeTrendPeriod('month')">月</el-button>
              <el-button size="small" :class="{ active: trendPeriod === 'year' }" @click="changeTrendPeriod('year')">年</el-button>
            </el-button-group>
          </div>
          <div ref="inventoryTrendChart" class="chart-container"></div>
        </div>

        <!-- 库区分布饼图 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>库区库存分布</h3>
          </div>
          <div ref="warehouseDistChart" class="chart-container"></div>
        </div>
      </div>

      <div class="chart-row">
        <!-- 出入库对比柱状图 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>出入库对比分析</h3>
          </div>
          <div ref="inoutCompareChart" class="chart-container"></div>
        </div>

        <!-- 商品分类统计 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>商品分类统计</h3>
          </div>
          <div ref="categoryChart" class="chart-container"></div>
        </div>
      </div>
    </div>

    <!-- 详细数据表格 -->
    <div class="data-table">
      <div class="table-header">
        <h3>详细数据</h3>
        <div class="table-actions">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索商品名称或编码"
            prefix-icon="el-icon-search"
            class="cyber-input"
            style="width: 250px;"
            @input="handleSearch"
          />
        </div>
      </div>
      
      <el-table
        :data="tableData"
        class="cyber-table"
        stripe
        @sort-change="handleSortChange"
      >
        <el-table-column prop="itemCode" label="商品编码" width="120" sortable />
        <el-table-column prop="itemName" label="商品名称" min-width="150" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="warehouse" label="库区" width="80">
          <template #default="{ row }">
            <el-tag class="warehouse-tag">{{ row.warehouse }}区</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentStock" label="当前库存" width="100" sortable>
          <template #default="{ row }">
            <span :class="getStockClass(row.currentStock, row.minStock)">
              {{ row.currentStock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="inboundQty" label="入库数量" width="100" sortable />
        <el-table-column prop="outboundQty" label="出库数量" width="100" sortable />
        <el-table-column prop="turnoverRate" label="周转率" width="100" sortable>
          <template #default="{ row }">
            <span class="turnover-rate">{{ row.turnoverRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="库存价值" width="120" sortable>
          <template #default="{ row }">
            <span class="inventory-value">¥{{ row.value.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdateTime" label="最后更新" width="160" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          class="cyber-pagination"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 响应式数据
const filterForm = reactive({
  dateRange: [],
  reportType: 'inventory',
  warehouse: ''
})

const kpiData = reactive({
  totalInventory: 12580,
  inboundCount: 156,
  outboundCount: 142,
  turnoverRate: 85.6
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const tableData = ref([])
const searchKeyword = ref('')
const trendPeriod = ref('month')

// 图表实例
const inventoryTrendChart = ref()
const warehouseDistChart = ref()
const inoutCompareChart = ref()
const categoryChart = ref()

let trendChartInstance = null
let distChartInstance = null
let compareChartInstance = null
let categoryChartInstance = null

// 模拟数据
const mockTableData = [
  {
    itemCode: 'P001',
    itemName: '笔记本电脑',
    category: '电子产品',
    warehouse: 'A',
    currentStock: 45,
    minStock: 20,
    inboundQty: 30,
    outboundQty: 25,
    turnoverRate: 78.5,
    value: 225000,
    lastUpdateTime: '2026-01-07 10:30:00'
  },
  {
    itemCode: 'P002',
    itemName: '无线鼠标',
    category: '电子产品',
    warehouse: 'A',
    currentStock: 180,
    minStock: 50,
    inboundQty: 100,
    outboundQty: 85,
    turnoverRate: 92.3,
    value: 18000,
    lastUpdateTime: '2026-01-07 09:45:00'
  },
  {
    itemCode: 'P003',
    itemName: '机械键盘',
    category: '电子产品',
    warehouse: 'B',
    currentStock: 75,
    minStock: 30,
    inboundQty: 50,
    outboundQty: 42,
    turnoverRate: 85.7,
    value: 37500,
    lastUpdateTime: '2026-01-07 11:15:00'
  },
  {
    itemCode: 'P004',
    itemName: '显示器',
    category: '电子产品',
    warehouse: 'B',
    currentStock: 28,
    minStock: 15,
    inboundQty: 20,
    outboundQty: 18,
    turnoverRate: 76.2,
    value: 84000,
    lastUpdateTime: '2026-01-07 08:20:00'
  },
  {
    itemCode: 'P005',
    itemName: '打印机',
    category: '办公设备',
    warehouse: 'C',
    currentStock: 12,
    minStock: 10,
    inboundQty: 8,
    outboundQty: 6,
    turnoverRate: 65.4,
    value: 24000,
    lastUpdateTime: '2026-01-07 07:30:00'
  }
]

// 方法
const getStockClass = (current, min) => {
  if (current <= min) return 'stock-low'
  if (current <= min * 1.5) return 'stock-warning'
  return 'stock-normal'
}

const handleDateChange = () => {
  console.log('日期范围变更:', filterForm.dateRange)
  refreshCharts()
}

const handleTypeChange = () => {
  console.log('报表类型变更:', filterForm.reportType)
  refreshCharts()
}

const handleExport = () => {
  ElMessage.success('报表导出功能开发中...')
}

const handleRefresh = () => {
  ElMessage.info('正在刷新数据...')
  refreshCharts()
  loadTableData()
}

const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value)
  loadTableData()
}

const handleSortChange = ({ prop, order }) => {
  console.log('排序变更:', prop, order)
  loadTableData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadTableData()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadTableData()
}

const changeTrendPeriod = (period) => {
  trendPeriod.value = period
  initInventoryTrendChart()
}

// 初始化库存趋势图
const initInventoryTrendChart = () => {
  if (!inventoryTrendChart.value) return
  
  if (trendChartInstance) {
    trendChartInstance.dispose()
  }
  
  trendChartInstance = echarts.init(inventoryTrendChart.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(18, 25, 44, 0.9)',
      borderColor: '#00FFFF',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['入库', '出库', '库存'],
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
      axisLine: { lineStyle: { color: '#00FFFF' } },
      axisLabel: { color: '#fff' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#00FFFF' } },
      axisLabel: { color: '#fff' },
      splitLine: { lineStyle: { color: 'rgba(0, 255, 255, 0.2)' } }
    },
    series: [
      {
        name: '入库',
        type: 'line',
        stack: 'Total',
        data: [120, 132, 101, 134, 90, 230, 210],
        lineStyle: { color: '#00FFFF' },
        areaStyle: { color: 'rgba(0, 255, 255, 0.2)' }
      },
      {
        name: '出库',
        type: 'line',
        stack: 'Total',
        data: [220, 182, 191, 234, 290, 330, 310],
        lineStyle: { color: '#FF3300' },
        areaStyle: { color: 'rgba(255, 51, 0, 0.2)' }
      },
      {
        name: '库存',
        type: 'line',
        data: [150, 232, 201, 154, 190, 330, 410],
        lineStyle: { color: '#FFD700' },
        areaStyle: { color: 'rgba(255, 215, 0, 0.2)' }
      }
    ]
  }
  
  trendChartInstance.setOption(option)
}

// 初始化库区分布饼图
const initWarehouseDistChart = () => {
  if (!warehouseDistChart.value) return
  
  if (distChartInstance) {
    distChartInstance.dispose()
  }
  
  distChartInstance = echarts.init(warehouseDistChart.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(18, 25, 44, 0.9)',
      borderColor: '#00FFFF',
      textStyle: { color: '#fff' }
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: '#fff' }
    },
    series: [
      {
        name: '库区分布',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 1048, name: 'A区' },
          { value: 735, name: 'B区' },
          { value: 580, name: 'C区' },
          { value: 484, name: 'D区' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 255, 255, 0.5)'
          }
        },
        itemStyle: {
          borderColor: '#00FFFF',
          borderWidth: 2
        }
      }
    ]
  }
  
  distChartInstance.setOption(option)
}

// 初始化出入库对比图
const initInoutCompareChart = () => {
  if (!inoutCompareChart.value) return
  
  if (compareChartInstance) {
    compareChartInstance.dispose()
  }
  
  compareChartInstance = echarts.init(inoutCompareChart.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(18, 25, 44, 0.9)',
      borderColor: '#00FFFF',
      textStyle: { color: '#fff' }
    },
    legend: {
      data: ['入库', '出库'],
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
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
      splitLine: { lineStyle: { color: 'rgba(0, 255, 255, 0.2)' } }
    },
    series: [
      {
        name: '入库',
        type: 'bar',
        data: [320, 302, 301, 334],
        itemStyle: { color: '#00FFFF' }
      },
      {
        name: '出库',
        type: 'bar',
        data: [120, 132, 101, 134],
        itemStyle: { color: '#FF3300' }
      }
    ]
  }
  
  compareChartInstance.setOption(option)
}

// 初始化商品分类图
const initCategoryChart = () => {
  if (!categoryChart.value) return
  
  if (categoryChartInstance) {
    categoryChartInstance.dispose()
  }
  
  categoryChartInstance = echarts.init(categoryChart.value)
  
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(18, 25, 44, 0.9)',
      borderColor: '#00FFFF',
      textStyle: { color: '#fff' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#00FFFF' } },
      axisLabel: { color: '#fff' },
      splitLine: { lineStyle: { color: 'rgba(0, 255, 255, 0.2)' } }
    },
    yAxis: {
      type: 'category',
      data: ['办公设备', '电子产品', '家具用品', '工具配件'],
      axisLine: { lineStyle: { color: '#00FFFF' } },
      axisLabel: { color: '#fff' }
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        data: [18, 28, 39, 81],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#00FFFF' },
            { offset: 1, color: '#FF3300' }
          ])
        }
      }
    ]
  }
  
  categoryChartInstance.setOption(option)
}

const refreshCharts = () => {
  nextTick(() => {
    initInventoryTrendChart()
    initWarehouseDistChart()
    initInoutCompareChart()
    initCategoryChart()
  })
}

const loadTableData = () => {
  tableData.value = [...mockTableData]
  pagination.total = mockTableData.length
}

// 生命周期
onMounted(() => {
  // 设置默认日期范围为最近30天
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  filterForm.dateRange = [startDate, endDate]
  
  loadTableData()
  
  nextTick(() => {
    refreshCharts()
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      if (trendChartInstance) trendChartInstance.resize()
      if (distChartInstance) distChartInstance.resize()
      if (compareChartInstance) compareChartInstance.resize()
      if (categoryChartInstance) categoryChartInstance.resize()
    })
  })
})
</script>

<style lang="scss" scoped>
.report-analysis {
  padding: 20px;
  background: var(--bg-primary);
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px;
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-cyber);

    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;

      i {
        color: var(--primary-color);
        font-size: 28px;
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .time-filter {
    margin-bottom: 24px;
    padding: 20px;
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-cyber);

    .filter-form {
      .el-form-item {
        margin-bottom: 0;
      }
    }
  }

  .kpi-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    .kpi-card {
      display: flex;
      align-items: center;
      padding: 24px;
      background: var(--glass-bg);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--shadow-cyber);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-hover);
      }

      .kpi-icon {
        width: 70px;
        height: 70px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20px;
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;

        i {
          font-size: 28px;
        }
      }

      .kpi-content {
        flex: 1;

        .kpi-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 6px;
        }

        .kpi-label {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .kpi-trend {
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;

          &.positive {
            color: var(--success-color);
          }

          &.negative {
            color: var(--danger-color);
          }
        }
      }
    }
  }

  .charts-section {
    margin-bottom: 24px;

    .chart-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .chart-card {
      background: var(--glass-bg);
      backdrop-filter: blur(8px);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: var(--shadow-cyber);
      padding: 20px;

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
        }

        .chart-controls {
          .el-button {
            background: transparent;
            border-color: var(--border-color);
            color: var(--text-secondary);
            font-size: 12px;
            padding: 4px 12px;

            &.active {
              background: var(--primary-color);
              border-color: var(--primary-color);
              color: white;
            }
          }
        }
      }

      .chart-container {
        height: 300px;
        width: 100%;
      }
    }
  }

  .data-table {
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-cyber);
    padding: 20px;

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }
    }

    .warehouse-tag {
      font-weight: 600;
    }

    .stock-low {
      color: var(--danger-color);
      font-weight: 600;
    }

    .stock-warning {
      color: var(--warning-color);
      font-weight: 600;
    }

    .stock-normal {
      color: var(--success-color);
      font-weight: 600;
    }

    .turnover-rate {
      font-weight: 600;
      color: var(--primary-color);
    }

    .inventory-value {
      font-weight: 600;
      color: var(--success-color);
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .report-analysis {
    .charts-section {
      .chart-row {
        grid-template-columns: 1fr;
      }
    }
  }
}

@media (max-width: 768px) {
  .report-analysis {
    padding: 12px;

    .page-header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;

      .header-actions {
        justify-content: center;
      }
    }

    .kpi-cards {
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .time-filter {
      .filter-form {
        .el-form-item {
          width: 100%;
          margin-bottom: 16px;
        }
      }
    }
  }
}

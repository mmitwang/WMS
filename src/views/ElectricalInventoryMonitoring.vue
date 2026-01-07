<template>
  <div class="electrical-inventory-monitoring">
    <!-- PLM风格顶部导航栏 -->
    <div class="plm-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Monitor /></el-icon>
          电气库存监控中心
        </h1>
        <div class="breadcrumb">
          <span>腾腾电气</span>
          <el-icon><ArrowRight /></el-icon>
          <span>库存监控</span>
        </div>
      </div>
      <div class="header-right">
        <el-button-group>
          <el-button type="primary" class="plm-btn">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
          <el-button type="success" class="plm-btn">
            <el-icon><Download /></el-icon>
            导出报告
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- PLM风格工作区 -->
    <div class="plm-workspace">
      <!-- 左侧监控面板 -->
      <div class="plm-sidebar">
        <div class="sidebar-header">
          <h3>监控面板</h3>
        </div>
        
        <!-- 实时状态卡片 -->
        <div class="status-cards">
          <div class="status-card critical">
            <div class="card-icon">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">库存预警</div>
              <div class="card-value">{{ alertCount }}</div>
            </div>
          </div>
          
          <div class="status-card success">
            <div class="card-icon">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">正常库存</div>
              <div class="card-value">{{ normalCount }}</div>
            </div>
          </div>
          
          <div class="status-card warning">
            <div class="card-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">即将到期</div>
              <div class="card-value">{{ expiringCount }}</div>
            </div>
          </div>
        </div>

        <!-- 快速筛选 -->
        <div class="quick-filters">
          <h4>快速筛选</h4>
          <el-checkbox-group v-model="selectedFilters" @change="applyFilters">
            <el-checkbox label="high-voltage">高压元器件</el-checkbox>
            <el-checkbox label="low-voltage">低压元器件</el-checkbox>
            <el-checkbox label="control">控制器件</el-checkbox>
            <el-checkbox label="sensor">传感器</el-checkbox>
            <el-checkbox label="cable">电缆线材</el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- MSL等级筛选 -->
        <div class="msl-filters">
          <h4>MSL湿度等级</h4>
          <el-radio-group v-model="selectedMSL" @change="applyFilters">
            <el-radio label="">全部</el-radio>
            <el-radio label="1">MSL-1</el-radio>
            <el-radio label="2">MSL-2</el-radio>
            <el-radio label="3">MSL-3</el-radio>
            <el-radio label="4">MSL-4</el-radio>
            <el-radio label="5">MSL-5</el-radio>
            <el-radio label="6">MSL-6</el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 主内容区 -->
      <div class="plm-content">
        <!-- 监控仪表盘 -->
        <div class="dashboard-section">
          <div class="dashboard-grid">
            <!-- 库存总览图表 -->
            <div class="chart-card">
              <div class="chart-header">
                <h3>库存总览</h3>
                <el-button size="small" text>
                  <el-icon><FullScreen /></el-icon>
                </el-button>
              </div>
              <div ref="inventoryOverviewChart" class="chart-container"></div>
            </div>

            <!-- 电压等级分布 -->
            <div class="chart-card">
              <div class="chart-header">
                <h3>电压等级分布</h3>
                <el-button size="small" text>
                  <el-icon><FullScreen /></el-icon>
                </el-button>
              </div>
              <div ref="voltageDistributionChart" class="chart-container"></div>
            </div>

            <!-- MSL等级统计 -->
            <div class="chart-card">
              <div class="chart-header">
                <h3>MSL湿度等级统计</h3>
                <el-button size="small" text>
                  <el-icon><FullScreen /></el-icon>
                </el-button>
              </div>
              <div ref="mslStatisticsChart" class="chart-container"></div>
            </div>

            <!-- 库存周转率 -->
            <div class="chart-card">
              <div class="chart-header">
                <h3>库存周转率趋势</h3>
                <el-button size="small" text>
                  <el-icon><FullScreen /></el-icon>
                </el-button>
              </div>
              <div ref="turnoverTrendChart" class="chart-container"></div>
            </div>
          </div>
        </div>

        <!-- 实时监控表格 -->
        <div class="monitoring-table-section">
          <div class="table-header">
            <h3>实时库存监控</h3>
            <div class="table-controls">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索元器件..."
                class="search-input"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              <el-button type="primary" @click="refreshData">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </div>
          
          <el-table
            :data="filteredInventoryData"
            class="monitoring-table"
            :row-class-name="getRowClassName"
            @row-click="showComponentDetails"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="partNumber" label="料号" width="120" fixed="left">
              <template #default="{ row }">
                <div class="part-number">
                  <span>{{ row.partNumber }}</span>
                  <div class="status-indicators">
                    <span v-if="row.mslLevel" class="msl-badge" :class="`msl-${row.mslLevel}`">
                      MSL-{{ row.mslLevel }}
                    </span>
                    <span v-if="row.esdSensitive" class="esd-badge">ESD</span>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="元器件名称" min-width="150" />
            <el-table-column prop="category" label="类别" width="100" />
            <el-table-column prop="voltageLevel" label="电压等级" width="100">
              <template #default="{ row }">
                <el-tag :type="getVoltageTagType(row.voltageLevel)" size="small">
                  {{ row.voltageLevel }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="currentStock" label="当前库存" width="100">
              <template #default="{ row }">
                <span :class="getStockClass(row)">{{ row.currentStock }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="minStock" label="最低库存" width="100" />
            <el-table-column prop="maxStock" label="最高库存" width="100" />
            <el-table-column label="库存状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStockStatusType(row)" size="small">
                  {{ getStockStatusText(row) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="存储位置" width="120" />
            <el-table-column prop="lastUpdated" label="最后更新" width="150" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" text @click.stop="adjustStock(row)">
                  调整
                </el-button>
                <el-button size="small" type="info" text @click.stop="viewHistory(row)">
                  历史
                </el-button>
                <el-button size="small" type="warning" text @click.stop="setAlert(row)">
                  预警
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="table-pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[20, 50, 100, 200]"
              :total="totalItems"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <div class="plm-properties" v-if="selectedComponent">
        <div class="properties-header">
          <h3>元器件详情</h3>
          <el-button size="small" text @click="selectedComponent = null">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="properties-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="料号">{{ selectedComponent.partNumber }}</el-descriptions-item>
            <el-descriptions-item label="名称">{{ selectedComponent.name }}</el-descriptions-item>
            <el-descriptions-item label="类别">{{ selectedComponent.category }}</el-descriptions-item>
            <el-descriptions-item label="电压等级">
              <el-tag :type="getVoltageTagType(selectedComponent.voltageLevel)" size="small">
                {{ selectedComponent.voltageLevel }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="MSL等级" v-if="selectedComponent.mslLevel">
              <span class="msl-badge" :class="`msl-${selectedComponent.mslLevel}`">
                MSL-{{ selectedComponent.mslLevel }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="ESD敏感" v-if="selectedComponent.esdSensitive">
              <span class="esd-badge">ESD敏感</span>
            </el-descriptions-item>
          </el-descriptions>

          <div class="properties-section">
            <h4>库存趋势</h4>
            <div ref="componentTrendChart" class="chart-container small"></div>
          </div>

          <div class="properties-section">
            <h4>存储环境</h4>
            <div class="environment-info">
              <div class="env-item">
                <span class="env-label">温度要求:</span>
                <span class="env-value">{{ selectedComponent.tempRequirement || 'N/A' }}</span>
              </div>
              <div class="env-item">
                <span class="env-label">湿度要求:</span>
                <span class="env-value">{{ selectedComponent.humidityRequirement || 'N/A' }}</span>
              </div>
              <div class="env-item">
                <span class="env-label">当前温度:</span>
                <span class="env-value">{{ selectedComponent.currentTemp || 'N/A' }}°C</span>
              </div>
              <div class="env-item">
                <span class="env-label">当前湿度:</span>
                <span class="env-value">{{ selectedComponent.currentHumidity || 'N/A' }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  Monitor, ArrowRight, Refresh, Download, Warning, CircleCheck, Clock,
  FullScreen, Search, Close
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const searchKeyword = ref('')
const selectedFilters = ref([])
const selectedMSL = ref('')
const selectedComponent = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)

// 图表引用
const inventoryOverviewChart = ref(null)
const voltageDistributionChart = ref(null)
const mslStatisticsChart = ref(null)
const turnoverTrendChart = ref(null)
const componentTrendChart = ref(null)

// 统计数据
const alertCount = ref(15)
const normalCount = ref(234)
const expiringCount = ref(8)

// 模拟库存数据
const inventoryData = ref([
  {
    id: 1,
    partNumber: 'TT-IC-001',
    name: '高压IGBT模块',
    category: '功率器件',
    voltageLevel: '高压(≥1kV)',
    currentStock: 45,
    minStock: 50,
    maxStock: 200,
    location: 'A1-01-05',
    mslLevel: 3,
    esdSensitive: true,
    tempRequirement: '-40~85°C',
    humidityRequirement: '<60%',
    currentTemp: 22,
    currentHumidity: 45,
    lastUpdated: '2024-01-07 14:30'
  },
  {
    id: 2,
    partNumber: 'TT-R-002',
    name: '精密电阻',
    category: '被动器件',
    voltageLevel: '低压(50V-1kV)',
    currentStock: 1200,
    minStock: 500,
    maxStock: 2000,
    location: 'B2-03-12',
    mslLevel: 1,
    esdSensitive: false,
    tempRequirement: '-55~125°C',
    humidityRequirement: '<85%',
    currentTemp: 24,
    currentHumidity: 50,
    lastUpdated: '2024-01-07 14:25'
  },
  {
    id: 3,
    partNumber: 'TT-C-003',
    name: '电解电容',
    category: '被动器件',
    voltageLevel: '低压(50V-1kV)',
    currentStock: 800,
    minStock: 300,
    maxStock: 1500,
    location: 'B1-02-08',
    mslLevel: 2,
    esdSensitive: false,
    tempRequirement: '-40~105°C',
    humidityRequirement: '<75%',
    currentTemp: 23,
    currentHumidity: 48,
    lastUpdated: '2024-01-07 14:20'
  }
])

// 计算属性
const filteredInventoryData = computed(() => {
  let filtered = inventoryData.value

  // 关键词搜索
  if (searchKeyword.value) {
    filtered = filtered.filter(item =>
      item.partNumber.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.category.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  // 类别筛选
  if (selectedFilters.value.length > 0) {
    filtered = filtered.filter(item => {
      return selectedFilters.value.some(filter => {
        switch (filter) {
          case 'high-voltage':
            return item.voltageLevel.includes('高压')
          case 'low-voltage':
            return item.voltageLevel.includes('低压')
          case 'control':
            return item.category.includes('控制')
          case 'sensor':
            return item.category.includes('传感')
          case 'cable':
            return item.category.includes('电缆')
          default:
            return false
        }
      })
    })
  }

  // MSL等级筛选
  if (selectedMSL.value) {
    filtered = filtered.filter(item => item.mslLevel === parseInt(selectedMSL.value))
  }

  return filtered
})

const totalItems = computed(() => filteredInventoryData.value.length)

// 方法
const getRowClassName = ({ row }) => {
  if (row.currentStock < row.minStock) {
    return 'warning-row'
  }
  if (row.currentStock > row.maxStock) {
    return 'danger-row'
  }
  return ''
}

const getStockClass = (row) => {
  if (row.currentStock < row.minStock) {
    return 'stock-low'
  }
  if (row.currentStock > row.maxStock) {
    return 'stock-high'
  }
  return 'stock-normal'
}

const getStockStatusType = (row) => {
  if (row.currentStock < row.minStock) {
    return 'danger'
  }
  if (row.currentStock > row.maxStock) {
    return 'warning'
  }
  return 'success'
}

const getStockStatusText = (row) => {
  if (row.currentStock < row.minStock) {
    return '库存不足'
  }
  if (row.currentStock > row.maxStock) {
    return '库存过量'
  }
  return '正常'
}

const getVoltageTagType = (voltageLevel) => {
  if (voltageLevel.includes('高压')) {
    return 'danger'
  }
  if (voltageLevel.includes('低压')) {
    return 'warning'
  }
  return 'info'
}

const applyFilters = () => {
  currentPage.value = 1
}

const refreshData = () => {
  console.log('刷新数据')
}

const showComponentDetails = (row) => {
  selectedComponent.value = row
  nextTick(() => {
    initComponentTrendChart()
  })
}

const adjustStock = (row) => {
  console.log('调整库存:', row)
}

const viewHistory = (row) => {
  console.log('查看历史:', row)
}

const setAlert = (row) => {
  console.log('设置预警:', row)
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 图表初始化方法
const initInventoryOverviewChart = () => {
  if (!inventoryOverviewChart.value) return
  
  const chart = echarts.init(inventoryOverviewChart.value)
  const option = {
    title: {
      text: '库存总览',
      textStyle: { fontSize: 14, color: '#333' }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['当前库存', '最低库存', '最高库存']
    },
    xAxis: {
      type: 'category',
      data: ['功率器件', '被动器件', '控制器件', '传感器', '电缆线材']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '当前库存',
        type: 'bar',
        data: [450, 2800, 1200, 800, 600],
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '最低库存',
        type: 'line',
        data: [300, 2000, 800, 500, 400],
        itemStyle: { color: '#F56C6C' }
      },
      {
        name: '最高库存',
        type: 'line',
        data: [800, 4000, 2000, 1500, 1000],
        itemStyle: { color: '#67C23A' }
      }
    ]
  }
  chart.setOption(option)
}

const initVoltageDistributionChart = () => {
  if (!voltageDistributionChart.value) return
  
  const chart = echarts.init(voltageDistributionChart.value)
  const option = {
    title: {
      text: '电压等级分布',
      textStyle: { fontSize: 14, color: '#333' }
    },
    tooltip: {
      trigger: 'item'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 1200, name: '高压(≥1kV)' },
        { value: 2800, name: '低压(50V-1kV)' },
        { value: 1850, name: '安全电压(<50V)' }
      ],
      itemStyle: {
        borderRadius: 5,
        borderColor: '#fff',
        borderWidth: 2
      }
    }]
  }
  chart.setOption(option)
}

const initMslStatisticsChart = () => {
  if (!mslStatisticsChart.value) return
  
  const chart = echarts.init(mslStatisticsChart.value)
  const option = {
    title: {
      text: 'MSL等级统计',
      textStyle: { fontSize: 14, color: '#333' }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['MSL-1', 'MSL-2', 'MSL-3', 'MSL-4', 'MSL-5', 'MSL-6']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      type: 'bar',
      data: [1200, 800, 600, 400, 200, 50],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      }
    }]
  }
  chart.setOption(option)
}

const initTurnoverTrendChart = () => {
  if (!turnoverTrendChart.value) return
  
  const chart = echarts.init(turnoverTrendChart.value)
  const option = {
    title: {
      text: '库存周转率趋势',
      textStyle: { fontSize: 14, color: '#333' }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      name: '周转率'
    },
    series: [{
      type: 'line',
      data: [2.3, 2.8, 3.1, 2.9, 3.4, 3.2],
      smooth: true,
      itemStyle: { color: '#722ed1' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(114, 46, 209, 0.3)' },
          { offset: 1, color: 'rgba(114, 46, 209, 0.1)' }
        ])
      }
    }]
  }
  chart.setOption(option)
}

const initComponentTrendChart = () => {
  if (!componentTrendChart.value || !selectedComponent.value) return
  
  const chart = echarts.init(componentTrendChart.value)
  const option = {
    title: {
      text: '库存变化趋势',
      textStyle: { fontSize: 12, color: '#333' }
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1周前', '6天前', '5天前', '4天前', '3天前', '2天前', '1天前', '今天']
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      type: 'line',
      data: [52, 48, 45, 47, 46, 44, 45, 45],
      smooth: true,
      itemStyle: { color: '#409EFF' }
    }]
  }
  chart.setOption(option)
}

onMounted(() => {
  nextTick(() => {
    initInventoryOverviewChart()
    initVoltageDistributionChart()
    initMslStatisticsChart()
    initTurnoverTrendChart()
  })
})
</script>

<style lang="scss" scoped>
@import '../styles/glassmorphism-business-theme.scss';

.electrical-inventory-monitoring {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);

  .plm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: rgba(10, 22, 40, 0.95);
    border-bottom: 1px solid rgba(114, 46, 209, 0.3);
    box-shadow: 0 2px 20px rgba(114, 46, 209, 0.2);

    .header-left {
      .page-title {
        display: flex;
        align-items: center;
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .title-icon {
          margin-right: 8px;
          color: var(--el-color-primary);
        }
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: var(--el-text-color-regular);

        .el-icon {
          margin: 0 8px;
          font-size: 12px;
        }
      }
    }

    .header-right {
      .plm-btn {
        background: linear-gradient(135deg, var(--electrical-primary), var(--electrical-secondary));
        border: none;
        border-radius: 6px;
        padding: 10px 20px;
      }
    }
  }

  .plm-workspace {
    flex: 1;
    display: flex;
    overflow: hidden;

    .plm-sidebar {
      width: 280px;
      background: rgba(10, 22, 40, 0.9);
      border-right: 1px solid rgba(114, 46, 209, 0.3);
      display: flex;
      flex-direction: column;
      padding: 16px;

      .sidebar-header {
        margin-bottom: 20px;

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
      }

      .status-cards {
        margin-bottom: 24px;

        .status-card {
          display: flex;
          align-items: center;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;

          &.critical {
            background: linear-gradient(135deg, #ff4d4f, #ff7875);
            color: white;
          }

          &.success {
            background: linear-gradient(135deg, #52c41a, #73d13d);
            color: white;
          }

          &.warning {
            background: linear-gradient(135deg, #faad14, #ffc53d);
            color: white;
          }

          .card-icon {
            font-size: 24px;
            margin-right: 12px;
          }

          .card-content {
            .card-title {
              font-size: 12px;
              opacity: 0.9;
            }

            .card-value {
              font-size: 20px;
              font-weight: 600;
              margin-top: 4px;
            }
          }
        }
      }

      .quick-filters, .msl-filters {
        margin-bottom: 24px;

        h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .el-checkbox-group, .el-radio-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      }
    }

    .plm-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--el-bg-color-page);
      overflow: hidden;

      .dashboard-section {
        padding: 24px;

        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;

          .chart-card {
            background: rgba(10, 22, 40, 0.85);
            border: 1px solid rgba(114, 46, 209, 0.2);
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(114, 46, 209, 0.15);
            backdrop-filter: blur(10px);

            .chart-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;

              h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: var(--el-text-color-primary);
              }
            }

            .chart-container {
              height: 200px;

              &.small {
                height: 150px;
              }
            }
          }
        }
      }

      .monitoring-table-section {
        flex: 1;
        padding: 0 24px 24px;
        display: flex;
        flex-direction: column;

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;

          h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }

          .table-controls {
            display: flex;
            gap: 12px;

            .search-input {
              width: 300px;
            }
          }
        }

        .monitoring-table {
          background: rgba(10, 22, 40, 0.85);
          border: 1px solid rgba(114, 46, 209, 0.2);
          border-radius: 8px;
          backdrop-filter: blur(10px);
          flex: 1;

          .part-number {
            .status-indicators {
              display: flex;
              gap: 4px;
              margin-top: 4px;

              .msl-badge, .esd-badge {
                font-size: 10px;
                padding: 2px 4px;
                border-radius: 2px;
                color: white;
              }

              .msl-badge {
                &.msl-1 { background: #52c41a; }
                &.msl-2 { background: #1890ff; }
                &.msl-3 { background: #faad14; }
                &.msl-4 { background: #fa8c16; }
                &.msl-5 { background: #f5222d; }
                &.msl-6 { background: #722ed1; }
              }

              .esd-badge {
                background: #ff4d4f;
              }
            }
          }

          .stock-low {
            color: #f5222d;
            font-weight: 600;
          }

          .stock-high {
            color: #fa8c16;
            font-weight: 600;
          }

          .stock-normal {
            color: #52c41a;
            font-weight: 600;
          }

          :deep(.warning-row) {
            background-color: #fff2e8;
          }

          :deep(.danger-row) {
            background-color: #fff1f0;
          }
        }

        .table-pagination {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
        }
      }
    }

    .plm-properties {
      width: 320px;
      background: rgba(10, 22, 40, 0.9);
      border-left: 1px solid rgba(114, 46, 209, 0.3);
      display: flex;
      flex-direction: column;

      .properties-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid var(--el-border-color-lighter);

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
      }

      .properties-content {
        flex: 1;
        padding: 16px;
        overflow: auto;

        .properties-section {
          margin-top: 24px;

          h4 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }

          .chart-container {
            height: 200px;

            &.small {
              height: 150px;
            }
          }

          .environment-info {
            .env-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;

              .env-label {
                color: var(--el-text-color-secondary);
              }

              .env-value {
                font-weight: 600;
                color: var(--el-text-color-primary);
              }
            }
          }
        }

        .msl-badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          color: white;

          &.msl-1 { background: #52c41a; }
          &.msl-2 { background: #1890ff; }
          &.msl-3 { background: #faad14; }
          &.msl-4 { background: #fa8c16; }
          &.msl-5 { background: #f5222d; }
          &.msl-6 { background: #722ed1; }
        }

        .esd-badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          background: #ff4d4f;
          color: white;
        }
      }
    }
  }
}
</style>

<template>
  <div class="electrical-warehouse-management">
    <!-- PLM风格顶部导航栏 -->
    <div class="plm-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><House /></el-icon>
          电气仓储管理系统
        </h1>
        <div class="breadcrumb">
          <span>腾腾电气</span>
          <el-icon><ArrowRight /></el-icon>
          <span>仓储管理</span>
        </div>
      </div>
      <div class="header-right">
        <el-button type="primary" class="plm-btn">
          <el-icon><Plus /></el-icon>
          新建仓库
        </el-button>
      </div>
    </div>

    <!-- PLM风格工作区 -->
    <div class="plm-workspace">
      <!-- 左侧导航树 -->
      <div class="plm-sidebar">
        <div class="sidebar-header">
          <h3>仓储结构</h3>
          <el-button size="small" text>
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        <el-tree
          :data="warehouseTree"
          :props="treeProps"
          node-key="id"
          default-expand-all
          @node-click="handleNodeClick"
          class="plm-tree"
        >
          <template #default="{ node, data }">
            <span class="tree-node">
              <el-icon class="node-icon">
                <component :is="getNodeIcon(data.type)" />
              </el-icon>
              <span>{{ node.label }}</span>
              <span class="node-count" v-if="data.count">({{ data.count }})</span>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- 主内容区 -->
      <div class="plm-content">
        <!-- 工具栏 -->
        <div class="plm-toolbar">
          <div class="toolbar-left">
            <el-button-group>
              <el-button :type="viewMode === 'grid' ? 'primary' : ''" @click="viewMode = 'grid'">
                <el-icon><Grid /></el-icon>
                网格视图
              </el-button>
              <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">
                <el-icon><List /></el-icon>
                列表视图
              </el-button>
              <el-button :type="viewMode === '3d' ? 'primary' : ''" @click="viewMode = '3d'">
                <el-icon><View /></el-icon>
                3D视图
              </el-button>
            </el-button-group>
          </div>
          <div class="toolbar-right">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索仓库、货架、位置..."
              class="search-input"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <!-- 内容展示区 -->
        <div class="content-area">
          <!-- 网格视图 -->
          <div v-if="viewMode === 'grid'" class="grid-view">
            <div class="warehouse-grid">
              <div
                v-for="warehouse in filteredWarehouses"
                :key="warehouse.id"
                class="warehouse-card"
                @click="selectWarehouse(warehouse)"
              >
                <div class="card-header">
                  <div class="warehouse-status" :class="warehouse.status"></div>
                  <h4>{{ warehouse.name }}</h4>
                  <el-dropdown trigger="click">
                    <el-icon class="card-menu"><MoreFilled /></el-icon>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="editWarehouse(warehouse)">编辑</el-dropdown-item>
                        <el-dropdown-item @click="viewDetails(warehouse)">详情</el-dropdown-item>
                        <el-dropdown-item divided @click="deleteWarehouse(warehouse)">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <div class="card-content">
                  <div class="warehouse-info">
                    <div class="info-item">
                      <span class="label">类型:</span>
                      <span class="value">{{ warehouse.type }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">面积:</span>
                      <span class="value">{{ warehouse.area }}m²</span>
                    </div>
                    <div class="info-item">
                      <span class="label">利用率:</span>
                      <el-progress
                        :percentage="warehouse.utilization"
                        :color="getUtilizationColor(warehouse.utilization)"
                        :show-text="false"
                        :stroke-width="6"
                      />
                      <span class="percentage">{{ warehouse.utilization }}%</span>
                    </div>
                  </div>
                  <div class="warehouse-stats">
                    <div class="stat-item">
                      <div class="stat-number">{{ warehouse.totalShelves }}</div>
                      <div class="stat-label">货架数</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-number">{{ warehouse.occupiedPositions }}</div>
                      <div class="stat-label">已占用</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-number">{{ warehouse.totalPositions }}</div>
                      <div class="stat-label">总位置</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 列表视图 -->
          <div v-if="viewMode === 'list'" class="list-view">
            <el-table :data="filteredWarehouses" class="plm-table" @row-click="selectWarehouse">
              <el-table-column prop="name" label="仓库名称" min-width="150">
                <template #default="{ row }">
                  <div class="warehouse-name">
                    <div class="warehouse-status" :class="row.status"></div>
                    <span>{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="type" label="仓库类型" width="120" />
              <el-table-column prop="area" label="面积(m²)" width="100" />
              <el-table-column label="利用率" width="150">
                <template #default="{ row }">
                  <el-progress
                    :percentage="row.utilization"
                    :color="getUtilizationColor(row.utilization)"
                    :stroke-width="8"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="totalShelves" label="货架数" width="80" />
              <el-table-column prop="occupiedPositions" label="已占用" width="80" />
              <el-table-column prop="totalPositions" label="总位置" width="80" />
              <el-table-column prop="manager" label="管理员" width="100" />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" type="primary" text @click.stop="editWarehouse(row)">
                    编辑
                  </el-button>
                  <el-button size="small" type="info" text @click.stop="viewDetails(row)">
                    详情
                  </el-button>
                  <el-button size="small" type="danger" text @click.stop="deleteWarehouse(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 3D视图 -->
          <div v-if="viewMode === '3d'" class="view-3d">
            <div class="view-3d-container" ref="threejsContainer">
              <div class="view-3d-placeholder">
                <el-icon class="placeholder-icon"><View /></el-icon>
                <h3>3D仓储可视化</h3>
                <p>Three.js 3D仓储布局展示</p>
                <el-button type="primary" @click="init3DView">
                  <el-icon><VideoPlay /></el-icon>
                  启动3D视图
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="plm-properties" v-if="selectedWarehouse">
        <div class="properties-header">
          <h3>属性面板</h3>
          <el-button size="small" text @click="selectedWarehouse = null">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="properties-content">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="仓库名称">{{ selectedWarehouse.name }}</el-descriptions-item>
            <el-descriptions-item label="仓库类型">{{ selectedWarehouse.type }}</el-descriptions-item>
            <el-descriptions-item label="仓库面积">{{ selectedWarehouse.area }}m²</el-descriptions-item>
            <el-descriptions-item label="管理员">{{ selectedWarehouse.manager }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ selectedWarehouse.createTime }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="selectedWarehouse.status === 'active' ? 'success' : 'warning'">
                {{ selectedWarehouse.status === 'active' ? '运行中' : '维护中' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="properties-section">
            <h4>存储统计</h4>
            <div class="stats-chart">
              <div ref="utilizationChart" class="chart-container"></div>
            </div>
          </div>

          <div class="properties-section">
            <h4>温湿度监控</h4>
            <div class="environment-data">
              <div class="env-item">
                <span class="env-label">温度:</span>
                <span class="env-value">{{ selectedWarehouse.temperature }}°C</span>
              </div>
              <div class="env-item">
                <span class="env-label">湿度:</span>
                <span class="env-value">{{ selectedWarehouse.humidity }}%</span>
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
  House, ArrowRight, Plus, Refresh, Grid, List, View, Search,
  MoreFilled, Close, VideoPlay
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const viewMode = ref('grid')
const searchKeyword = ref('')
const selectedWarehouse = ref(null)
const threejsContainer = ref(null)
const utilizationChart = ref(null)

// 仓库树形数据
const warehouseTree = ref([
  {
    id: 1,
    label: '腾腾电气总仓',
    type: 'warehouse',
    count: 156,
    children: [
      {
        id: 11,
        label: 'A区-高压元器件',
        type: 'zone',
        count: 45,
        children: [
          { id: 111, label: 'A1货架', type: 'shelf', count: 12 },
          { id: 112, label: 'A2货架', type: 'shelf', count: 18 },
          { id: 113, label: 'A3货架', type: 'shelf', count: 15 }
        ]
      },
      {
        id: 12,
        label: 'B区-低压元器件',
        type: 'zone',
        count: 67,
        children: [
          { id: 121, label: 'B1货架', type: 'shelf', count: 22 },
          { id: 122, label: 'B2货架', type: 'shelf', count: 25 },
          { id: 123, label: 'B3货架', type: 'shelf', count: 20 }
        ]
      },
      {
        id: 13,
        label: 'C区-控制器件',
        type: 'zone',
        count: 44,
        children: [
          { id: 131, label: 'C1货架', type: 'shelf', count: 15 },
          { id: 132, label: 'C2货架', type: 'shelf', count: 16 },
          { id: 133, label: 'C3货架', type: 'shelf', count: 13 }
        ]
      }
    ]
  }
])

const treeProps = {
  children: 'children',
  label: 'label'
}

// 仓库数据
const warehouses = ref([
  {
    id: 1,
    name: '腾腾电气总仓',
    type: '综合仓库',
    area: 2500,
    utilization: 78,
    totalShelves: 45,
    occupiedPositions: 156,
    totalPositions: 200,
    manager: '张工程师',
    status: 'active',
    temperature: 22,
    humidity: 45,
    createTime: '2024-01-15'
  },
  {
    id: 2,
    name: '高压元器件专仓',
    type: '专业仓库',
    area: 800,
    utilization: 65,
    totalShelves: 15,
    occupiedPositions: 45,
    totalPositions: 70,
    manager: '李主管',
    status: 'active',
    temperature: 20,
    humidity: 40,
    createTime: '2024-02-10'
  },
  {
    id: 3,
    name: '低压配件仓',
    type: '配件仓库',
    area: 1200,
    utilization: 82,
    totalShelves: 25,
    occupiedPositions: 98,
    totalPositions: 120,
    manager: '王技师',
    status: 'maintenance',
    temperature: 24,
    humidity: 50,
    createTime: '2024-03-05'
  }
])

// 计算属性
const filteredWarehouses = computed(() => {
  if (!searchKeyword.value) return warehouses.value
  return warehouses.value.filter(warehouse =>
    warehouse.name.includes(searchKeyword.value) ||
    warehouse.type.includes(searchKeyword.value) ||
    warehouse.manager.includes(searchKeyword.value)
  )
})

// 方法
const getNodeIcon = (type) => {
  const iconMap = {
    warehouse: 'House',
    zone: 'Grid',
    shelf: 'List'
  }
  return iconMap[type] || 'Folder'
}

const getUtilizationColor = (percentage) => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

const handleNodeClick = (data) => {
  console.log('节点点击:', data)
}

const selectWarehouse = (warehouse) => {
  selectedWarehouse.value = warehouse
  nextTick(() => {
    initUtilizationChart()
  })
}

const editWarehouse = (warehouse) => {
  console.log('编辑仓库:', warehouse)
}

const viewDetails = (warehouse) => {
  console.log('查看详情:', warehouse)
}

const deleteWarehouse = (warehouse) => {
  console.log('删除仓库:', warehouse)
}

const init3DView = () => {
  console.log('初始化3D视图')
}

const initUtilizationChart = () => {
  if (!utilizationChart.value || !selectedWarehouse.value) return
  
  const chart = echarts.init(utilizationChart.value)
  const option = {
    title: {
      text: '存储利用率',
      textStyle: { fontSize: 14, color: '#333' }
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: selectedWarehouse.value.occupiedPositions, name: '已占用' },
        { value: selectedWarehouse.value.totalPositions - selectedWarehouse.value.occupiedPositions, name: '空闲' }
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

onMounted(() => {
  // 初始化
})
</script>

<style lang="scss" scoped>
@import '../styles/glassmorphism-business-theme.scss';

.electrical-warehouse-management {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(10, 22, 40, 0.95);

  .plm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: rgba(10, 22, 40, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(114, 46, 209, 0.2);
    box-shadow: 0 2px 8px rgba(114, 46, 209, 0.1);

    .header-left {
      .page-title {
        display: flex;
        align-items: center;
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #ffffff;

        .title-icon {
          margin-right: 8px;
          color: var(--electric-glow);
        }
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        font-size: 14px;
        color: var(--text-secondary);

        .el-icon {
          margin: 0 8px;
          font-size: 12px;
        }
      }
    }

    .plm-btn {
      background: linear-gradient(135deg, var(--electric-glow), #722ed1);
      border: none;
      border-radius: 6px;
      padding: 10px 20px;
      color: #000000;
      font-weight: 600;
      
      &:hover {
        background: linear-gradient(135deg, #722ed1, var(--electric-glow));
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(114, 46, 209, 0.3);
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
      backdrop-filter: blur(10px);
      border-right: 1px solid rgba(114, 46, 209, 0.2);
      display: flex;
      flex-direction: column;

      .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid rgba(114, 46, 209, 0.15);

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }
        
        .el-button {
          background: transparent;
          border: 1px solid rgba(114, 46, 209, 0.3);
          color: var(--electric-glow);
          
          &:hover {
            background: rgba(114, 46, 209, 0.2);
          }
        }
      }

      .plm-tree {
        flex: 1;
        padding: 8px;

        :deep(.el-tree) {
          background: transparent;
          color: #ffffff;
          
          .el-tree-node__content {
            background: transparent;
            color: #ffffff;
            
            &:hover {
              background: rgba(114, 46, 209, 0.2);
            }
          }
          
          .el-tree-node.is-current > .el-tree-node__content {
            background: rgba(114, 46, 209, 0.3);
          }
          
          .el-tree-node__expand-icon {
            color: var(--electric-glow);
          }
        }

        .tree-node {
          display: flex;
          align-items: center;
          width: 100%;

          .node-icon {
            margin-right: 8px;
            color: var(--electric-glow);
          }

          .node-count {
            margin-left: auto;
            font-size: 12px;
            color: var(--text-secondary);
            background: rgba(114, 46, 209, 0.2);
            padding: 2px 6px;
            border-radius: 10px;
          }
        }
      }
    }

    .plm-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: rgba(10, 22, 40, 0.85);

      .plm-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        background: rgba(10, 22, 40, 0.9);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid rgba(114, 46, 209, 0.2);

        .toolbar-left {
          :deep(.el-button-group) {
            .el-button {
              background: rgba(10, 22, 40, 0.8);
              border: 1px solid rgba(114, 46, 209, 0.3);
              color: #ffffff;
              
              &:hover {
                background: rgba(114, 46, 209, 0.3);
              }
              
              &.el-button--primary {
                background: var(--electric-glow);
                color: #000000;
                border-color: var(--electric-glow);
              }
            }
          }
        }

        .search-input {
          width: 300px;
          
          :deep(.el-input__wrapper) {
            background: rgba(10, 22, 40, 0.9);
            border: 1px solid rgba(114, 46, 209, 0.3);
            
            .el-input__inner {
              color: #ffffff;
              
              &::placeholder {
                color: rgba(255, 255, 255, 0.5);
              }
            }
            
            .el-input__prefix-inner {
              color: var(--electric-glow);
            }
          }
        }
      }

      .content-area {
        flex: 1;
        padding: 24px;
        overflow: auto;

        .grid-view {
          .warehouse-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 20px;

            .warehouse-card {
              background: rgba(10, 22, 40, 0.85);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(114, 46, 209, 0.2);
              border-radius: 12px;
              padding: 20px;
              cursor: pointer;
              transition: all 0.3s ease;

              &:hover {
                border-color: rgba(114, 46, 209, 0.4);
                box-shadow: 0 8px 24px rgba(114, 46, 209, 0.2);
                transform: translateY(-4px);
              }

              .card-header {
                display: flex;
                align-items: center;
                margin-bottom: 16px;

                .warehouse-status {
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  margin-right: 8px;

                  &.active {
                    background: #52c41a;
                    box-shadow: 0 0 8px rgba(82, 196, 26, 0.5);
                  }

                  &.maintenance {
                    background: #faad14;
                    box-shadow: 0 0 8px rgba(250, 173, 20, 0.5);
                  }
                }

                h4 {
                  flex: 1;
                  margin: 0;
                  font-size: 16px;
                  font-weight: 600;
                  color: #ffffff;
                }

                .card-menu {
                  cursor: pointer;
                  color: var(--text-secondary);

                  &:hover {
                    color: var(--electric-glow);
                  }
                }
              }

              .card-content {
                .warehouse-info {
                  margin-bottom: 16px;

                  .info-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 8px;

                    .label {
                      width: 60px;
                      font-size: 14px;
                      color: var(--text-secondary);
                    }

                    .value {
                      flex: 1;
                      font-size: 14px;
                      color: #ffffff;
                    }

                    .el-progress {
                      flex: 1;
                      margin-right: 8px;
                      
                      :deep(.el-progress-bar__outer) {
                        background: rgba(114, 46, 209, 0.2);
                      }
                    }

                    .percentage {
                      font-size: 12px;
                      color: var(--text-secondary);
                    }
                  }
                }

                .warehouse-stats {
                  display: flex;
                  justify-content: space-between;

                  .stat-item {
                    text-align: center;

                    .stat-number {
                      font-size: 20px;
                      font-weight: 600;
                      color: var(--electric-glow);
                    }

                    .stat-label {
                      font-size: 12px;
                      color: var(--text-secondary);
                      margin-top: 4px;
                    }
                  }
                }
              }
            }
          }
        }

        .list-view {
          .plm-table {
            background: rgba(10, 22, 40, 0.85);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(114, 46, 209, 0.2);
            border-radius: 12px;
            overflow: hidden;

            :deep(.el-table) {
              background: transparent;
              
              .el-table__header {
                background: rgba(10, 22, 40, 0.9);
                
                th {
                  background: transparent;
                  color: #ffffff;
                  border-bottom: 1px solid rgba(114, 46, 209, 0.3);
                }
              }
              
              .el-table__body {
                tr {
                  background: transparent;
                  
                  &:hover {
                    background: rgba(114, 46, 209, 0.1) !important;
                  }
                  
                  td {
                    background: transparent;
                    color: #ffffff;
                    border-bottom: 1px solid rgba(114, 46, 209, 0.15);
                  }
                }
              }
            }

            .warehouse-name {
              display: flex;
              align-items: center;

              .warehouse-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: 8px;

                &.active {
                  background: #52c41a;
                  box-shadow: 0 0 6px rgba(82, 196, 26, 0.5);
                }

                &.maintenance {
                  background: #faad14;
                  box-shadow: 0 0 6px rgba(250, 173, 20, 0.5);
                }
              }
            }
          }
        }

        .view-3d {
          .view-3d-container {
            height: 600px;
            background: rgba(10, 22, 40, 0.85);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(114, 46, 209, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;

            .view-3d-placeholder {
              text-align: center;

              .placeholder-icon {
                font-size: 64px;
                color: var(--electric-glow);
                margin-bottom: 16px;
              }

              h3 {
                margin: 0 0 8px 0;
                color: #ffffff;
              }

              p {
                margin: 0 0 24px 0;
                color: var(--text-secondary);
              }
              
              .el-button {
                background: linear-gradient(135deg, var(--electric-glow), #722ed1);
                border: none;
                color: #000000;
                font-weight: 600;
                
                &:hover {
                  background: linear-gradient(135deg, #722ed1, var(--electric-glow));
                  transform: translateY(-1px);
                  box-shadow: 0 4px 12px rgba(114, 46, 209, 0.3);
                }
              }
            }
          }
        }
      }
    }

    .plm-properties {
      width: 320px;
      background: rgba(10, 22, 40, 0.9);
      backdrop-filter: blur(10px);
      border-left: 1px solid rgba(114, 46, 209, 0.2);
      display: flex;
      flex-direction: column;

      .properties-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid rgba(114, 46, 209, 0.15);

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
        }
        
        .el-button {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          
          &:hover {
            color: var(--electric-glow);
          }
        }
      }

      .properties-content {
        flex: 1;
        padding: 16px;
        overflow: auto;

        :deep(.el-descriptions) {
          .el-descriptions__header {
            .el-descriptions__title {
              color: #ffffff;
            }
          }
          
          .el-descriptions__body {
            .el-descriptions__table {
              border-color: rgba(114, 46, 209, 0.2);
              
              .el-descriptions__cell {
                border-color: rgba(114, 46, 209, 0.2);
                background: rgba(10, 22, 40, 0.5);
                
                .el-descriptions__label {
                  color: var(--text-secondary);
                }
                
                .el-descriptions__content {
                  color: #ffffff;
                }
              }
            }
          }
        }

        .properties-section {
          margin-top: 24px;

          h4 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
          }

          .chart-container {
            height: 200px;
            background: rgba(10, 22, 40, 0.6);
            border-radius: 8px;
            border: 1px solid rgba(114, 46, 209, 0.2);
          }

          .environment-data {
            background: rgba(10, 22, 40, 0.6);
            border-radius: 8px;
            border: 1px solid rgba(114, 46, 209, 0.2);
            padding: 12px;
            
            .env-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;

              .env-label {
                color: var(--text-secondary);
              }

              .env-value {
                font-weight: 600;
                color: var(--electric-glow);
              }
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .electrical-warehouse-management {
    .plm-workspace {
      .plm-sidebar {
        width: 240px;
      }
      
      .plm-properties {
        width: 280px;
      }
    }
  }
}

@media (max-width: 768px) {
  .electrical-warehouse-management {
    .plm-header {
      flex-direction: column;
      gap: 12px;
      
      .header-left, .header-right {
        width: 100%;
      }
    }
    
    .plm-workspace {
      flex-direction: column;
      
      .plm-sidebar {
        width: 100%;
        height: 200px;
      }
      
      .plm-properties {
        width: 100%;
        height: 300px;
      }
      
      .plm-content {
        .plm-toolbar {
          flex-direction: column;
          gap: 12px;
          
          .toolbar-left, .search-input {
            width: 100%;
          }
        }
        
        .content-area {
          .grid-view .warehouse-grid {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  }
}
</style>

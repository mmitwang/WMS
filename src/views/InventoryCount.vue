<template>
  <div class="inventory-count">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <i class="el-icon-document-checked"></i>
        盘点管理
      </h1>
      <div class="header-actions">
        <el-button type="primary" class="cyber-button" @click="showCreateDialog = true">
          <i class="el-icon-plus"></i>
          新建盘点任务
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="el-icon-document"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalTasks }}</div>
          <div class="stat-label">总盘点任务</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pending">
          <i class="el-icon-time"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pendingTasks }}</div>
          <div class="stat-label">待执行任务</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon processing">
          <i class="el-icon-loading"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.processingTasks }}</div>
          <div class="stat-label">进行中任务</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">
          <i class="el-icon-check"></i>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.completedTasks }}</div>
          <div class="stat-label">已完成任务</div>
        </div>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="盘点单号">
          <el-input
            v-model="searchForm.countNo"
            placeholder="请输入盘点单号"
            clearable
            class="cyber-input"
          />
        </el-form-item>
        <el-form-item label="盘点类型">
          <el-select v-model="searchForm.countType" placeholder="请选择盘点类型" clearable class="cyber-select">
            <el-option label="全盘" value="full" />
            <el-option label="抽盘" value="sample" />
            <el-option label="循环盘点" value="cycle" />
            <el-option label="动态盘点" value="dynamic" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable class="cyber-select">
            <el-option label="待执行" value="pending" />
            <el-option label="进行中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="库区">
          <el-select v-model="searchForm.warehouse" placeholder="请选择库区" clearable class="cyber-select">
            <el-option label="A区" value="A" />
            <el-option label="B区" value="B" />
            <el-option label="C区" value="C" />
            <el-option label="D区" value="D" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="cyber-button" @click="handleSearch">
            <i class="el-icon-search"></i>
            搜索
          </el-button>
          <el-button class="cyber-button-secondary" @click="handleReset">
            <i class="el-icon-refresh"></i>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 盘点任务列表 -->
    <div class="count-list">
      <el-table
        :data="countList"
        class="cyber-table"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="countNo" label="盘点单号" width="160">
          <template #default="{ row }">
            <span class="count-no">{{ row.countNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="countType" label="盘点类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getCountTypeColor(row.countType)" class="type-tag">
              {{ getCountTypeText(row.countType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="库区" width="80">
          <template #default="{ row }">
            <el-tag class="warehouse-tag">{{ row.warehouse }}区</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="itemCount" label="商品数量" width="100" />
        <el-table-column prop="countedItems" label="已盘数量" width="100">
          <template #default="{ row }">
            <span class="counted-items">{{ row.countedItems }}/{{ row.itemCount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.countedItems / row.itemCount) * 100)"
              :color="getProgressColor(row.countedItems / row.itemCount)"
              class="progress-bar"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" class="status-tag">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="operator" label="操作员" width="100" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              class="cyber-button-mini"
              @click="handleView(row)"
            >
              查看
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              size="small"
              type="primary"
              class="cyber-button-mini"
              @click="handleStart(row)"
            >
              开始
            </el-button>
            <el-button
              v-if="row.status === 'processing'"
              size="small"
              type="success"
              class="cyber-button-mini"
              @click="handleCount(row)"
            >
              盘点
            </el-button>
            <el-button
              v-if="row.status === 'processing' && row.countedItems === row.itemCount"
              size="small"
              type="warning"
              class="cyber-button-mini"
              @click="handleComplete(row)"
            >
              完成
            </el-button>
            <el-button
              v-if="['pending', 'processing'].includes(row.status)"
              size="small"
              type="danger"
              class="cyber-button-mini"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
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

    <!-- 新建盘点任务对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建盘点任务"
      width="700px"
      class="cyber-dialog"
      :before-close="handleCloseDialog"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
        class="create-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="盘点类型" prop="countType">
              <el-select v-model="createForm.countType" placeholder="请选择盘点类型" class="cyber-select">
                <el-option label="全盘" value="full" />
                <el-option label="抽盘" value="sample" />
                <el-option label="循环盘点" value="cycle" />
                <el-option label="动态盘点" value="dynamic" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库区" prop="warehouse">
              <el-select v-model="createForm.warehouse" placeholder="请选择库区" class="cyber-select">
                <el-option label="A区" value="A" />
                <el-option label="B区" value="B" />
                <el-option label="C区" value="C" />
                <el-option label="D区" value="D" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划开始时间" prop="planStartTime">
              <el-date-picker
                v-model="createForm.planStartTime"
                type="datetime"
                placeholder="选择开始时间"
                class="cyber-date-picker"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划结束时间" prop="planEndTime">
              <el-date-picker
                v-model="createForm.planEndTime"
                type="datetime"
                placeholder="选择结束时间"
                class="cyber-date-picker"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="盘点说明" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入盘点说明"
            class="cyber-textarea"
          />
        </el-form-item>
        <el-form-item label="盘点范围">
          <el-checkbox-group v-model="createForm.countScope" class="scope-group">
            <el-checkbox label="正常库存" value="normal" />
            <el-checkbox label="冻结库存" value="frozen" />
            <el-checkbox label="待检库存" value="pending" />
            <el-checkbox label="损坏库存" value="damaged" />
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="cyber-button-secondary" @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" class="cyber-button" @click="handleCreate">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 盘点详情对话框 -->
    <el-dialog
      v-model="showCountDialog"
      title="商品盘点"
      width="900px"
      class="cyber-dialog"
    >
      <div class="count-detail">
        <div class="count-info">
          <el-descriptions :column="3" border>
            <el-descriptions-item label="盘点单号">{{ currentCount.countNo }}</el-descriptions-item>
            <el-descriptions-item label="盘点类型">{{ getCountTypeText(currentCount.countType) }}</el-descriptions-item>
            <el-descriptions-item label="库区">{{ currentCount.warehouse }}区</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="count-items">
          <el-table :data="countItems" class="cyber-table-mini" max-height="400">
            <el-table-column prop="itemCode" label="商品编码" width="120" />
            <el-table-column prop="itemName" label="商品名称" />
            <el-table-column prop="location" label="库位" width="100" />
            <el-table-column prop="systemQuantity" label="系统数量" width="100" />
            <el-table-column prop="actualQuantity" label="实盘数量" width="120">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.actualQuantity"
                  :min="0"
                  size="small"
                  class="cyber-input-number"
                  @change="handleQuantityChange(row, $index)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="difference" label="差异" width="100">
              <template #default="{ row }">
                <span :class="getDifferenceClass(row.difference)">
                  {{ row.difference > 0 ? '+' : '' }}{{ row.difference }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.actualQuantity !== null ? 'success' : 'warning'" size="small">
                  {{ row.actualQuantity !== null ? '已盘' : '未盘' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="cyber-button-secondary" @click="showCountDialog = false">关闭</el-button>
          <el-button type="primary" class="cyber-button" @click="handleSaveCount">保存盘点</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const searchForm = reactive({
  countNo: '',
  countType: '',
  status: '',
  warehouse: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const createForm = reactive({
  countType: '',
  warehouse: '',
  planStartTime: '',
  planEndTime: '',
  description: '',
  countScope: ['normal']
})

const createRules = {
  countType: [
    { required: true, message: '请选择盘点类型', trigger: 'change' }
  ],
  warehouse: [
    { required: true, message: '请选择库区', trigger: 'change' }
  ],
  planStartTime: [
    { required: true, message: '请选择计划开始时间', trigger: 'change' }
  ],
  planEndTime: [
    { required: true, message: '请选择计划结束时间', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入盘点说明', trigger: 'blur' }
  ]
}

const countList = ref([])
const selectedCounts = ref([])
const showCreateDialog = ref(false)
const showCountDialog = ref(false)
const currentCount = ref({})
const countItems = ref([])
const createFormRef = ref()

// 统计数据
const stats = computed(() => {
  const total = countList.value.length
  const pending = countList.value.filter(item => item.status === 'pending').length
  const processing = countList.value.filter(item => item.status === 'processing').length
  const completed = countList.value.filter(item => item.status === 'completed').length
  
  return {
    totalTasks: total,
    pendingTasks: pending,
    processingTasks: processing,
    completedTasks: completed
  }
})

// 模拟数据
const mockCountList = [
  {
    id: 1,
    countNo: 'IC202601070001',
    countType: 'full',
    warehouse: 'A',
    itemCount: 150,
    countedItems: 120,
    status: 'processing',
    createTime: '2026-01-07 09:00:00',
    operator: '张三'
  },
  {
    id: 2,
    countNo: 'IC202601070002',
    countType: 'sample',
    warehouse: 'B',
    itemCount: 50,
    countedItems: 50,
    status: 'completed',
    createTime: '2026-01-07 08:30:00',
    operator: '李四'
  },
  {
    id: 3,
    countNo: 'IC202601070003',
    countType: 'cycle',
    warehouse: 'C',
    itemCount: 80,
    countedItems: 0,
    status: 'pending',
    createTime: '2026-01-07 10:00:00',
    operator: '王五'
  },
  {
    id: 4,
    countNo: 'IC202601070004',
    countType: 'dynamic',
    warehouse: 'D',
    itemCount: 30,
    countedItems: 15,
    status: 'processing',
    createTime: '2026-01-07 09:45:00',
    operator: '赵六'
  }
]

const mockCountItems = [
  { itemCode: 'P001', itemName: '笔记本电脑', location: 'A01-01-01', systemQuantity: 50, actualQuantity: null, difference: 0 },
  { itemCode: 'P002', itemName: '无线鼠标', location: 'A01-01-02', systemQuantity: 200, actualQuantity: 198, difference: -2 },
  { itemCode: 'P003', itemName: '机械键盘', location: 'A01-01-03', systemQuantity: 80, actualQuantity: 82, difference: 2 },
  { itemCode: 'P004', itemName: '显示器', location: 'A01-02-01', systemQuantity: 30, actualQuantity: null, difference: 0 },
  { itemCode: 'P005', itemName: '打印机', location: 'A01-02-02', systemQuantity: 15, actualQuantity: 15, difference: 0 }
]

// 方法
const getCountTypeColor = (type) => {
  const colorMap = {
    full: 'primary',
    sample: 'success',
    cycle: 'warning',
    dynamic: 'info'
  }
  return colorMap[type] || 'info'
}

const getCountTypeText = (type) => {
  const textMap = {
    full: '全盘',
    sample: '抽盘',
    cycle: '循环盘点',
    dynamic: '动态盘点'
  }
  return textMap[type] || '未知'
}

const getStatusType = (status) => {
  const statusMap = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待执行',
    processing: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || '未知'
}

const getProgressColor = (progress) => {
  if (progress < 0.3) return '#f56c6c'
  if (progress < 0.7) return '#e6a23c'
  return '#67c23a'
}

const getDifferenceClass = (difference) => {
  if (difference > 0) return 'difference-positive'
  if (difference < 0) return 'difference-negative'
  return 'difference-zero'
}

const handleSearch = () => {
  console.log('搜索条件:', searchForm)
  loadCountList()
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  loadCountList()
}

const handleSelectionChange = (selection) => {
  selectedCounts.value = selection
}

const handleView = (row) => {
  ElMessage.info(`查看盘点任务: ${row.countNo}`)
}

const handleStart = (row) => {
  ElMessageBox.confirm(
    `确定要开始盘点任务 ${row.countNo} 吗？`,
    '确认开始',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = 'processing'
    ElMessage.success('盘点任务已开始')
  })
}

const handleCount = (row) => {
  currentCount.value = row
  countItems.value = [...mockCountItems]
  showCountDialog.value = true
}

const handleComplete = (row) => {
  ElMessageBox.confirm(
    `确定要完成盘点任务 ${row.countNo} 吗？`,
    '确认完成',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = 'completed'
    ElMessage.success('盘点任务已完成')
  })
}

const handleCancel = (row) => {
  ElMessageBox.confirm(
    `确定要取消盘点任务 ${row.countNo} 吗？`,
    '确认取消',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = 'cancelled'
    ElMessage.success('盘点任务已取消')
  })
}

const handleQuantityChange = (row, index) => {
  row.difference = row.actualQuantity - row.systemQuantity
}

const handleSaveCount = () => {
  const countedItems = countItems.value.filter(item => item.actualQuantity !== null).length
  currentCount.value.countedItems = countedItems
  ElMessage.success('盘点数据已保存')
  showCountDialog.value = false
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadCountList()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadCountList()
}

const handleCloseDialog = () => {
  showCreateDialog.value = false
  resetCreateForm()
}

const resetCreateForm = () => {
  Object.keys(createForm).forEach(key => {
    if (key === 'countScope') {
      createForm[key] = ['normal']
    } else {
      createForm[key] = ''
    }
  })
}

const handleCreate = () => {
  createFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟创建盘点任务
      const newCount = {
        id: Date.now(),
        countNo: `IC${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(countList.value.length + 1).padStart(4, '0')}`,
        countType: createForm.countType,
        warehouse: createForm.warehouse,
        itemCount: Math.floor(Math.random() * 100) + 50,
        countedItems: 0,
        status: 'pending',
        createTime: new Date().toLocaleString(),
        operator: '当前用户'
      }
      
      countList.value.unshift(newCount)
      pagination.total++
      
      ElMessage.success('盘点任务创建成功')
      handleCloseDialog()
    }
  })
}

const loadCountList = () => {
  countList.value = [...mockCountList]
  pagination.total = mockCountList.length
}

// 生命周期
onMounted(() => {
  loadCountList()
})
</script>

<style lang="scss" scoped>
.inventory-count {
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
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
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

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        background: var(--primary-color);
        color: white;

        &.pending {
          background: var(--warning-color);
        }

        &.processing {
          background: var(--primary-color);
        }

        &.completed {
          background: var(--success-color);
        }

        i {
          font-size: 24px;
        }
      }

      .stat-content {
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-secondary);
        }
      }
    }
  }

  .search-section {
    margin-bottom: 24px;
    padding: 20px;
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-cyber);

    .search-form {
      .el-form-item {
        margin-bottom: 0;
      }
    }
  }

  .count-list {
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-cyber);
    padding: 20px;

    .count-no {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: var(--primary-color);
    }

    .type-tag, .warehouse-tag, .status-tag {
      font-weight: 600;
    }

    .counted-items {
      font-weight: 600;
      color: var(--primary-color);
    }

    .progress-bar {
      width: 100%;
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }

  .create-form {
    .scope-group {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
  }

  .count-detail {
    .count-info {
      margin-bottom: 20px;
    }

    .count-items {
      .difference-positive {
        color: var(--success-color);
        font-weight: 600;
      }

      .difference-negative {
        color: var(--danger-color);
        font-weight: 600;
      }

      .difference-zero {
        color: var(--text-secondary);
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .inventory-count {
    padding: 12px;

    .page-header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;

      .header-actions {
        display: flex;
        justify-content: center;
      }
    }

    .stats-cards {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .search-section {
      .search-form {
        .el-form-item {
          width: 100%;
          margin-bottom: 16px;
        }
      }
    }
  }
}
</style>

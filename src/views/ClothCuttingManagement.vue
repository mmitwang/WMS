<template>
  <div class="cloth-cutting-management">
    <div class="page-header">
      <h2>卷材裁剪与余料管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showRequisitionDialog = true">
          <el-icon><Download /></el-icon>
          卷材领用
        </el-button>
        <el-button type="success" @click="showCuttingDialog = true">
          <el-icon><Scissors /></el-icon>
          裁剪记录
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><Box /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalRequisitions }}</div>
          <div class="stat-label">今日领用</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><Scissors /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalCuttings }}</div>
          <div class="stat-label">今日裁剪</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><RefreshRight /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalRemnants }}</div>
          <div class="stat-label">余料数量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.utilizationRate }}%</div>
          <div class="stat-label">利用率</div>
        </div>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="操作类型">
          <el-select v-model="filterForm.type" placeholder="请选择类型" clearable>
            <el-option label="领用记录" value="requisition" />
            <el-option label="裁剪记录" value="cutting" />
            <el-option label="余料记录" value="remnant" />
          </el-select>
        </el-form-item>
        <el-form-item label="卷材编码">
          <el-input v-model="filterForm.clothCode" placeholder="请输入卷材编码" clearable />
        </el-form-item>
        <el-form-item label="生产订单">
          <el-input v-model="filterForm.productionOrder" placeholder="请输入生产订单号" clearable />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="filterForm.operator" placeholder="请输入操作人" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="info" @click="showTraceDialog = true">余料追溯</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作记录列表 -->
    <div class="records-table">
      <el-table :data="recordsList" class="cyber-table" stripe v-loading="loading">
        <el-table-column prop="id" label="记录ID" width="100" />
        <el-table-column prop="type" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="clothCode" label="卷材编码" width="200" />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="department" label="部门" width="100" />
        <el-table-column prop="length" label="长度(m)" width="100" />
        <el-table-column prop="productionOrder" label="生产订单" width="150" />
        <el-table-column prop="operateTime" label="操作时间" width="160" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">详情</el-button>
            <el-button 
              size="small" 
              type="primary" 
              v-if="row.type === 'requisition' && row.status === '已领用'"
              @click="handleCutting(row)"
            >
              裁剪
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              v-if="row.type === 'cutting' && row.remnantLength > 0"
              @click="handleRemnantInbound(row)"
            >
              余料入库
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 卷材领用对话框 -->
    <el-dialog v-model="showRequisitionDialog" title="卷材领用" width="600px" @close="resetRequisitionForm">
      <el-form :model="requisitionForm" :rules="requisitionRules" ref="requisitionFormRef" label-width="120px">
        <el-form-item label="卷材选择" prop="clothId">
          <el-select 
            v-model="requisitionForm.clothId" 
            placeholder="请选择卷材" 
            filterable 
            @change="handleClothSelect"
          >
            <el-option 
              v-for="cloth in availableCloths" 
              :key="cloth.id"
              :label="`${cloth.code} (${cloth.length}m)`"
              :value="cloth.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="卷材信息" v-if="selectedCloth">
          <div class="cloth-info">
            <p><strong>编码:</strong> {{ selectedCloth.code }}</p>
            <p><strong>材质:</strong> {{ selectedCloth.material }}</p>
            <p><strong>宽幅:</strong> {{ selectedCloth.width }}mm</p>
            <p><strong>剩余长度:</strong> {{ selectedCloth.length }}m</p>
          </div>
        </el-form-item>
        <el-form-item label="领用长度(m)" prop="requisitionLength">
          <el-input-number 
            v-model="requisitionForm.requisitionLength" 
            :min="0.1" 
            :max="selectedCloth?.length || 999999"
            :precision="2" 
            placeholder="请输入领用长度"
          />
        </el-form-item>
        <el-form-item label="领用部门" prop="department">
          <el-select v-model="requisitionForm.department" placeholder="请选择部门">
            <el-option label="生产部" value="生产部" />
            <el-option label="质检部" value="质检部" />
            <el-option label="研发部" value="研发部" />
          </el-select>
        </el-form-item>
        <el-form-item label="领用人" prop="operator">
          <el-input v-model="requisitionForm.operator" placeholder="请输入领用人姓名" />
        </el-form-item>
        <el-form-item label="生产订单号" prop="productionOrder">
          <el-input v-model="requisitionForm.productionOrder" placeholder="请输入生产订单号" />
        </el-form-item>
        <el-form-item label="领用原因" prop="reason">
          <el-input 
            v-model="requisitionForm.reason" 
            type="textarea" 
            :rows="3"
            placeholder="请输入领用原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRequisitionDialog = false">取消</el-button>
        <el-button type="primary" @click="handleRequisition" :loading="requisitionLoading">
          确认领用
        </el-button>
      </template>
    </el-dialog>

    <!-- 裁剪记录对话框 -->
    <el-dialog v-model="showCuttingDialog" title="裁剪记录" width="600px" @close="resetCuttingForm">
      <el-form :model="cuttingForm" :rules="cuttingRules" ref="cuttingFormRef" label-width="120px">
        <el-form-item label="领用单号" prop="requisitionId">
          <el-select 
            v-model="cuttingForm.requisitionId" 
            placeholder="请选择领用单"
            @change="handleRequisitionSelect"
          >
            <el-option 
              v-for="req in pendingRequisitions" 
              :key="req.id"
              :label="`${req.requisitionNo} - ${req.clothCode}`"
              :value="req.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="领用信息" v-if="selectedRequisition">
          <div class="requisition-info">
            <p><strong>卷材编码:</strong> {{ selectedRequisition.clothCode }}</p>
            <p><strong>领用长度:</strong> {{ selectedRequisition.requisitionLength }}m</p>
            <p><strong>生产订单:</strong> {{ selectedRequisition.productionOrder }}</p>
          </div>
        </el-form-item>
        <el-form-item label="实际裁剪长度(m)" prop="actualCuttingLength">
          <el-input-number 
            v-model="cuttingForm.actualCuttingLength" 
            :min="0.1" 
            :max="selectedRequisition?.requisitionLength || 999999"
            :precision="2" 
            placeholder="请输入实际裁剪长度"
            @change="calculateRemnant"
          />
        </el-form-item>
        <el-form-item label="余料长度(m)" prop="remnantLength">
          <el-input-number 
            v-model="cuttingForm.remnantLength" 
            :min="0" 
            :precision="2" 
            placeholder="系统自动计算"
            readonly
          />
        </el-form-item>
        <el-form-item label="裁剪人员" prop="cuttingOperator">
          <el-input v-model="cuttingForm.cuttingOperator" placeholder="请输入裁剪人员姓名" />
        </el-form-item>
        <el-form-item label="裁剪备注">
          <el-input 
            v-model="cuttingForm.cuttingRemark" 
            type="textarea" 
            :rows="3"
            placeholder="请输入裁剪备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCuttingDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCuttingRecord" :loading="cuttingLoading">
          确认裁剪
        </el-button>
      </template>
    </el-dialog>

    <!-- 余料追溯对话框 -->
    <el-dialog v-model="showTraceDialog" title="余料追溯查询" width="800px">
      <div class="trace-search">
        <el-form :inline="true">
          <el-form-item label="查询条件">
            <el-input 
              v-model="traceQuery" 
              placeholder="请输入卷材编码/余料编码/生产订单号"
              @keyup.enter="handleTrace"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleTrace">查询</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div class="trace-timeline" v-if="traceRecords.length > 0">
        <el-timeline>
          <el-timeline-item 
            v-for="record in traceRecords" 
            :key="record.id"
            :timestamp="record.operateTime"
            :type="getTimelineType(record.type)"
          >
            <div class="trace-item">
              <h4>{{ getTypeText(record.type) }}</h4>
              <p><strong>操作人:</strong> {{ record.operator }}</p>
              <p><strong>长度变更:</strong> {{ record.lengthChange }}</p>
              <p><strong>库位变更:</strong> {{ record.locationChange }}</p>
              <p v-if="record.remark"><strong>备注:</strong> {{ record.remark }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
      
      <el-empty v-else description="暂无追溯记录" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Scissors, Box, RefreshRight, TrendCharts } from '@element-plus/icons-vue'
import { cuttingService } from '../services/cuttingService'

// 响应式数据
const loading = ref(false)
const requisitionLoading = ref(false)
const cuttingLoading = ref(false)
const showRequisitionDialog = ref(false)
const showCuttingDialog = ref(false)
const showTraceDialog = ref(false)
const recordsList = ref([])
const availableCloths = ref([])
const pendingRequisitions = ref([])
const selectedCloth = ref(null)
const selectedRequisition = ref(null)
const traceRecords = ref([])
const traceQuery = ref('')

// 统计数据
const stats = reactive({
  totalRequisitions: 0,
  totalCuttings: 0,
  totalRemnants: 0,
  utilizationRate: 0
})

// 筛选表单
const filterForm = reactive({
  type: '',
  clothCode: '',
  productionOrder: '',
  operator: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 领用表单
const requisitionForm = reactive({
  clothId: null,
  requisitionLength: null,
  department: '',
  operator: '',
  productionOrder: '',
  reason: ''
})

const requisitionFormRef = ref()

// 裁剪表单
const cuttingForm = reactive({
  requisitionId: null,
  actualCuttingLength: null,
  remnantLength: null,
  cuttingOperator: '',
  cuttingRemark: ''
})

const cuttingFormRef = ref()

// 表单验证规则
const requisitionRules = {
  clothId: [{ required: true, message: '请选择卷材', trigger: 'change' }],
  requisitionLength: [{ required: true, message: '请输入领用长度', trigger: 'blur' }],
  department: [{ required: true, message: '请选择领用部门', trigger: 'change' }],
  operator: [{ required: true, message: '请输入领用人', trigger: 'blur' }],
  productionOrder: [{ required: true, message: '请输入生产订单号', trigger: 'blur' }]
}

const cuttingRules = {
  requisitionId: [{ required: true, message: '请选择领用单', trigger: 'change' }],
  actualCuttingLength: [{ required: true, message: '请输入实际裁剪长度', trigger: 'blur' }],
  cuttingOperator: [{ required: true, message: '请输入裁剪人员', trigger: 'blur' }]
}

// 方法
const getTypeColor = (type) => {
  const colors = {
    requisition: 'primary',
    cutting: 'success',
    remnant: 'warning'
  }
  return colors[type] || 'info'
}

const getTypeText = (type) => {
  const texts = {
    requisition: '领用',
    cutting: '裁剪',
    remnant: '余料'
  }
  return texts[type] || '未知'
}

const getStatusColor = (status) => {
  const colors = {
    '已领用': 'warning',
    '已裁剪': 'success',
    '已入库': 'info'
  }
  return colors[status] || 'info'
}

const getTimelineType = (type) => {
  const types = {
    requisition: 'primary',
    cutting: 'success',
    remnant: 'warning'
  }
  return types[type] || 'info'
}

const handleClothSelect = async (clothId) => {
  selectedCloth.value = availableCloths.value.find(cloth => cloth.id === clothId)
}

const handleRequisitionSelect = async (requisitionId) => {
  selectedRequisition.value = pendingRequisitions.value.find(req => req.id === requisitionId)
}

const calculateRemnant = () => {
  if (cuttingForm.actualCuttingLength && selectedRequisition.value) {
    cuttingForm.remnantLength = Math.max(0, 
      selectedRequisition.value.requisitionLength - cuttingForm.actualCuttingLength
    )
  }
}

const handleSearch = async () => {
  loading.value = true
  try {
    const result = await cuttingService.getRecords({
      ...filterForm,
      page: pagination.page,
      size: pagination.size
    })
    recordsList.value = result.data
    pagination.total = result.total
  } catch (error) {
    ElMessage.error('查询失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  Object.keys(filterForm).forEach(key => {
    filterForm[key] = ''
  })
  handleSearch()
}

const handleRequisition = async () => {
  if (!requisitionFormRef.value) return
  
  try {
    await requisitionFormRef.value.validate()
    requisitionLoading.value = true
    
    await cuttingService.createRequisition(requisitionForm)
    ElMessage.success('领用成功')
    showRequisitionDialog.value = false
    handleSearch()
    loadStats()
  } catch (error) {
    ElMessage.error('领用失败: ' + error.message)
  } finally {
    requisitionLoading.value = false
  }
}

const handleCuttingRecord = async () => {
  if (!cuttingFormRef.value) return
  
  try {
    await cuttingFormRef.value.validate()
    cuttingLoading.value = true
    
    await cuttingService.createCutting(cuttingForm)
    ElMessage.success('裁剪记录成功')
    showCuttingDialog.value = false
    handleSearch()
    loadStats()
  } catch (error) {
    ElMessage.error('裁剪记录失败: ' + error.message)
  } finally {
    cuttingLoading.value = false
  }
}

const handleCutting = (row) => {
  showCuttingDialog.value = true
  cuttingForm.requisitionId = row.id
  handleRequisitionSelect(row.id)
}

const handleRemnantInbound = async (row) => {
  try {
    await ElMessageBox.confirm('确认将余料入库？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cuttingService.remnantInbound(row.id)
    ElMessage.success('余料入库成功')
    handleSearch()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('余料入库失败: ' + error.message)
    }
  }
}

const handleTrace = async () => {
  if (!traceQuery.value.trim()) {
    ElMessage.warning('请输入查询条件')
    return
  }
  
  try {
    const result = await cuttingService.getTraceRecords(traceQuery.value)
    traceRecords.value = result.data
  } catch (error) {
    ElMessage.error('查询失败: ' + error.message)
  }
}

const handleView = (row) => {
  console.log('查看详情:', row)
}

const handleSizeChange = (size) => {
  pagination.size = size
  handleSearch()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  handleSearch()
}

const resetRequisitionForm = () => {
  if (requisitionFormRef.value) {
    requisitionFormRef.value.resetFields()
  }
  Object.keys(requisitionForm).forEach(key => {
    if (typeof requisitionForm[key] === 'string') {
      requisitionForm[key] = ''
    } else {
      requisitionForm[key] = null
    }
  })
  selectedCloth.value = null
}

const resetCuttingForm = () => {
  if (cuttingFormRef.value) {
    cuttingFormRef.value.resetFields()
  }
  Object.keys(cuttingForm).forEach(key => {
    if (typeof cuttingForm[key] === 'string') {
      cuttingForm[key] = ''
    } else {
      cuttingForm[key] = null
    }
  })
  selectedRequisition.value = null
}

const loadAvailableCloths = async () => {
  try {
    const result = await cuttingService.getAvailableCloths()
    availableCloths.value = result.data
  } catch (error) {
    console.error('加载可用卷材失败:', error)
  }
}

const loadPendingRequisitions = async () => {
  try {
    const result = await cuttingService.getPendingRequisitions()
    pendingRequisitions.value = result.data
  } catch (error) {
    console.error('加载待裁剪领用单失败:', error)
  }
}

const loadStats = async () => {
  try {
    const result = await cuttingService.getStats()
    Object.assign(stats, result.data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 生命周期
onMounted(() => {
  handleSearch()
  loadAvailableCloths()
  loadPendingRequisitions()
  loadStats()
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';

.cloth-cutting-management {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);

    h2 {
      color: var(--text-primary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-md);
    }
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);

    .stat-card {
      @include glass-effect;
      padding: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      transition: all var(--transition-normal) ease;

      &:hover {
        @include cyber-glow;
        transform: translateY(-2px);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--gradient-cyber);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-primary);
        font-size: 24px;
      }

      .stat-content {
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-muted);
          margin-top: 4px;
        }
      }
    }
  }

  .filter-bar {
    @include glass-effect;
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }

  .records-table {
    @include glass-effect;
    padding: var(--spacing-lg);

    :deep(.cyber-table) {
      background: transparent;

      .el-table__header th {
        background: var(--bg-secondary);
        color: var(--text-cyber);
        border-bottom: 1px solid var(--border-primary);
      }

      .el-table__body tr {
        background: transparent;
        
        &:hover {
          background: rgba(0, 255, 255, 0.05) !important;
        }

        td {
          border-bottom: 1px solid var(--border-secondary);
          color: var(--text-primary);
        }
      }
    }

    .table-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: var(--spacing-lg);
    }
  }

  .cloth-info,
  .requisition-info {
    padding: var(--spacing-md);
    background: var(--bg-secondary);
    border-radius: var(--border-radius);
    border: 1px solid var(--border-secondary);

    p {
      margin: var(--spacing-xs) 0;
      color: var(--text-primary);
    }
  }

  .trace-search {
    margin-bottom: var(--spacing-lg);
  }

  .trace-timeline {
    max-height: 400px;
    overflow-y: auto;

    .trace-item {
      h4 {
        color: var(--text-primary);
        margin: 0 0 var(--spacing-sm) 0;
      }

      p {
        margin: var(--spacing-xs) 0;
        color: var(--text-secondary);
        font-size: 14px;
      }
    }
  }
}
</style>

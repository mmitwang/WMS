<template>
  <div class="filter-cloth-management">
    <div class="page-header">
      <h2>严牌滤布卷材管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        录入卷材
      </el-button>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="卷材编码">
          <el-input v-model="filterForm.code" placeholder="请输入卷材编码" clearable />
        </el-form-item>
        <el-form-item label="材质">
          <el-select v-model="filterForm.material" placeholder="请选择材质" clearable>
            <el-option label="涤纶" value="DL" />
            <el-option label="PPS" value="PPS" />
            <el-option label="芳纶" value="FL" />
            <el-option label="PTFE" value="PTFE" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="待入库" value="pending" />
            <el-option label="已入库" value="stored" />
            <el-option label="已出库" value="outbound" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 卷材列表 -->
    <div class="cloth-table">
      <el-table :data="clothList" class="cyber-table" stripe v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="卷材编码" width="200" />
        <el-table-column prop="material" label="材质" width="80" />
        <el-table-column prop="width" label="宽幅(mm)" width="100" />
        <el-table-column prop="length" label="长度(m)" width="100" />
        <el-table-column prop="weight" label="重量(kg)" width="100" />
        <el-table-column prop="productionDate" label="生产日期" width="120" />
        <el-table-column prop="batchNo" label="批次号" width="120" />
        <el-table-column prop="supplier" label="供应商" width="120" />
        <el-table-column prop="locationCode" label="库位" width="150" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">详情</el-button>
            <el-button size="small" type="primary" v-if="row.status === 'pending'" @click="handleAssignLocation(row)">
              分配库位
            </el-button>
            <el-button size="small" type="success" v-if="row.locationCode && row.status === 'pending'" @click="handleInbound(row)">
              入库
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-button type="primary" :disabled="!selectedRows.length" @click="handleBatchInbound">
          批量入库
        </el-button>
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

    <!-- 录入卷材对话框 -->
    <el-dialog v-model="showAddDialog" title="录入卷材信息" width="600px" @close="resetAddForm">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="120px">
        <el-form-item label="材质" prop="material">
          <el-select v-model="addForm.material" placeholder="请选择材质" @change="generateCode">
            <el-option label="涤纶" value="DL" />
            <el-option label="PPS" value="PPS" />
            <el-option label="芳纶" value="FL" />
            <el-option label="PTFE" value="PTFE" />
          </el-select>
        </el-form-item>
        <el-form-item label="宽幅(mm)" prop="width">
          <el-input-number v-model="addForm.width" :min="500" :max="6000" @change="generateCode" />
        </el-form-item>
        <el-form-item label="总长度(m)" prop="length">
          <el-input-number v-model="addForm.length" :min="10" :max="10000" :precision="2" />
        </el-form-item>
        <el-form-item label="重量(kg)" prop="weight">
          <el-input-number v-model="addForm.weight" :min="50" :max="500" :precision="2" />
        </el-form-item>
        <el-form-item label="生产日期" prop="productionDate">
          <el-date-picker v-model="addForm.productionDate" type="date" placeholder="选择生产日期" @change="generateCode" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchNo">
          <el-input v-model="addForm.batchNo" placeholder="请输入批次号" @input="generateCode" />
        </el-form-item>
        <el-form-item label="供应商" prop="supplier">
          <el-input v-model="addForm.supplier" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="到货数量" prop="quantity">
          <el-input-number v-model="addForm.quantity" :min="1" :max="100" />
        </el-form-item>
        <el-form-item label="卷材编码">
          <el-input v-model="generatedCode" readonly placeholder="系统自动生成" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAdd" :loading="addLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 库位分配对话框 -->
    <el-dialog v-model="showLocationDialog" title="智能库位分配" width="500px">
      <div v-if="recommendedLocation">
        <el-alert
          :title="`推荐库位: ${recommendedLocation.code}`"
          :description="recommendedLocation.description"
          type="success"
          show-icon
          :closable="false"
        />
        <div class="location-info">
          <p><strong>适配性说明:</strong> {{ recommendedLocation.reason }}</p>
          <p><strong>库位容量:</strong> {{ recommendedLocation.capacity }}</p>
          <p><strong>当前使用率:</strong> {{ recommendedLocation.usage }}%</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showLocationDialog = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmLocation" :loading="locationLoading">
          确认分配
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { filterClothService } from '../services/filterClothService'

// 响应式数据
const loading = ref(false)
const addLoading = ref(false)
const locationLoading = ref(false)
const showAddDialog = ref(false)
const showLocationDialog = ref(false)
const clothList = ref([])
const selectedRows = ref([])
const currentCloth = ref(null)
const recommendedLocation = ref(null)
const generatedCode = ref('')

// 筛选表单
const filterForm = reactive({
  code: '',
  material: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 添加表单
const addForm = reactive({
  material: '',
  width: null,
  length: null,
  weight: null,
  productionDate: '',
  batchNo: '',
  supplier: '',
  quantity: 1
})

const addFormRef = ref()

// 表单验证规则
const addRules = {
  material: [{ required: true, message: '请选择材质', trigger: 'change' }],
  width: [
    { required: true, message: '请输入宽幅', trigger: 'blur' },
    { type: 'number', min: 500, message: '宽幅不能小于500mm', trigger: 'blur' }
  ],
  length: [
    { required: true, message: '请输入长度', trigger: 'blur' },
    { type: 'number', min: 10, message: '长度不能小于10m', trigger: 'blur' }
  ],
  weight: [{ required: true, message: '请输入重量', trigger: 'blur' }],
  productionDate: [{ required: true, message: '请选择生产日期', trigger: 'change' }],
  batchNo: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  supplier: [{ required: true, message: '请输入供应商', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入到货数量', trigger: 'blur' }]
}

// 计算属性
const selectedRows = computed(() => {
  // 这里应该绑定表格的选中行
  return []
})

// 方法
const generateCode = () => {
  if (addForm.material && addForm.width && addForm.productionDate && addForm.batchNo) {
    const dateStr = new Date(addForm.productionDate).toISOString().slice(0, 10).replace(/-/g, '')
    generatedCode.value = `YP-${addForm.material}-${addForm.width}-${dateStr}-${addForm.batchNo}`
  }
}

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    stored: 'success',
    outbound: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待入库',
    stored: '已入库',
    outbound: '已出库'
  }
  return texts[status] || '未知'
}

const handleSearch = async () => {
  loading.value = true
  try {
    const result = await filterClothService.getList({
      ...filterForm,
      page: pagination.page,
      size: pagination.size
    })
    clothList.value = result.data
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

const handleAdd = async () => {
  if (!addFormRef.value) return
  
  try {
    await addFormRef.value.validate()
    addLoading.value = true
    
    const data = {
      ...addForm,
      code: generatedCode.value
    }
    
    await filterClothService.create(data)
    ElMessage.success('录入成功')
    showAddDialog.value = false
    handleSearch()
  } catch (error) {
    if (error.message.includes('编码已存在')) {
      ElMessage.error('卷材编码已存在，请检查输入信息')
    } else {
      ElMessage.error('录入失败: ' + error.message)
    }
  } finally {
    addLoading.value = false
  }
}

const handleAssignLocation = async (row) => {
  try {
    locationLoading.value = true
    currentCloth.value = row
    
    const result = await filterClothService.getRecommendedLocation({
      width: row.width,
      weight: row.weight,
      material: row.material
    })
    
    recommendedLocation.value = result
    showLocationDialog.value = true
  } catch (error) {
    ElMessage.error('获取推荐库位失败: ' + error.message)
  } finally {
    locationLoading.value = false
  }
}

const handleConfirmLocation = async () => {
  try {
    locationLoading.value = true
    
    await filterClothService.assignLocation({
      clothId: currentCloth.value.id,
      locationCode: recommendedLocation.value.code
    })
    
    ElMessage.success('库位分配成功')
    showLocationDialog.value = false
    handleSearch()
  } catch (error) {
    ElMessage.error('库位分配失败: ' + error.message)
  } finally {
    locationLoading.value = false
  }
}

const handleInbound = async (row) => {
  try {
    await ElMessageBox.confirm('确认将该卷材入库？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await filterClothService.inbound([row.id])
    ElMessage.success('入库成功')
    handleSearch()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('入库失败: ' + error.message)
    }
  }
}

const handleBatchInbound = async () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请选择要入库的卷材')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确认将选中的 ${selectedRows.value.length} 个卷材入库？`, '批量入库', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    await filterClothService.inbound(ids)
    ElMessage.success('批量入库成功')
    handleSearch()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量入库失败: ' + error.message)
    }
  }
}

const handleView = (row) => {
  // 查看详情逻辑
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

const resetAddForm = () => {
  if (addFormRef.value) {
    addFormRef.value.resetFields()
  }
  Object.keys(addForm).forEach(key => {
    if (typeof addForm[key] === 'string') {
      addForm[key] = ''
    } else {
      addForm[key] = null
    }
  })
  addForm.quantity = 1
  generatedCode.value = ''
}

// 生命周期
onMounted(() => {
  handleSearch()
})
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';

.filter-cloth-management {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);

    h2 {
      color: var(--text-primary);
      margin: 0;
    }
  }

  .filter-bar {
    @include glass-effect;
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }

  .cloth-table {
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
      justify-content: space-between;
      align-items: center;
      margin-top: var(--spacing-lg);
    }
  }

  .location-info {
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    background: var(--bg-secondary);
    border-radius: var(--border-radius);

    p {
      margin: var(--spacing-sm) 0;
      color: var(--text-primary);
    }
  }
}
</style>

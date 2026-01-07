<template>
  <div class="stock-transfer">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">
        <i class="el-icon-sort"></i>
        库存调拨
      </h1>
      <div class="header-actions">
        <el-button type="primary" class="cyber-button" @click="showCreateDialog = true">
          <i class="el-icon-plus"></i>
          新建调拨单
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="调拨单号">
          <el-input
            v-model="searchForm.transferNo"
            placeholder="请输入调拨单号"
            clearable
            class="cyber-input"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable class="cyber-select">
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="调拨中" value="transferring" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="源库区">
          <el-select v-model="searchForm.sourceWarehouse" placeholder="请选择源库区" clearable class="cyber-select">
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

    <!-- 调拨单列表 -->
    <div class="transfer-list">
      <el-table
        :data="transferList"
        class="cyber-table"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="transferNo" label="调拨单号" width="160">
          <template #default="{ row }">
            <span class="transfer-no">{{ row.transferNo }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sourceWarehouse" label="源库区" width="100">
          <template #default="{ row }">
            <el-tag class="warehouse-tag">{{ row.sourceWarehouse }}区</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetWarehouse" label="目标库区" width="100">
          <template #default="{ row }">
            <el-tag class="warehouse-tag" type="success">{{ row.targetWarehouse }}区</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="itemCount" label="商品数量" width="100" />
        <el-table-column prop="totalQuantity" label="总数量" width="100">
          <template #default="{ row }">
            <span class="quantity">{{ row.totalQuantity }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" class="status-tag">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="operator" label="操作员" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
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
              @click="handleApprove(row)"
            >
              审核
            </el-button>
            <el-button
              v-if="row.status === 'approved'"
              size="small"
              type="success"
              class="cyber-button-mini"
              @click="handleExecute(row)"
            >
              执行
            </el-button>
            <el-button
              v-if="['pending', 'approved'].includes(row.status)"
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

    <!-- 新建调拨单对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建调拨单"
      width="800px"
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
            <el-form-item label="源库区" prop="sourceWarehouse">
              <el-select v-model="createForm.sourceWarehouse" placeholder="请选择源库区" class="cyber-select">
                <el-option label="A区" value="A" />
                <el-option label="B区" value="B" />
                <el-option label="C区" value="C" />
                <el-option label="D区" value="D" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标库区" prop="targetWarehouse">
              <el-select v-model="createForm.targetWarehouse" placeholder="请选择目标库区" class="cyber-select">
                <el-option label="A区" value="A" />
                <el-option label="B区" value="B" />
                <el-option label="C区" value="C" />
                <el-option label="D区" value="D" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="调拨原因" prop="reason">
          <el-input
            v-model="createForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入调拨原因"
            class="cyber-textarea"
          />
        </el-form-item>
        <el-form-item label="商品明细">
          <div class="item-list">
            <el-table :data="createForm.items" class="cyber-table-mini">
              <el-table-column prop="itemCode" label="商品编码" width="120" />
              <el-table-column prop="itemName" label="商品名称" />
              <el-table-column prop="currentStock" label="当前库存" width="100" />
              <el-table-column prop="transferQuantity" label="调拨数量" width="120">
                <template #default="{ row, $index }">
                  <el-input-number
                    v-model="row.transferQuantity"
                    :min="1"
                    :max="row.currentStock"
                    size="small"
                    class="cyber-input-number"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ $index }">
                  <el-button
                    size="small"
                    type="danger"
                    class="cyber-button-mini"
                    @click="removeItem($index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button
              type="primary"
              class="cyber-button add-item-btn"
              @click="showSelectItemDialog = true"
            >
              <i class="el-icon-plus"></i>
              添加商品
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="cyber-button-secondary" @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" class="cyber-button" @click="handleCreate">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 选择商品对话框 -->
    <el-dialog
      v-model="showSelectItemDialog"
      title="选择商品"
      width="600px"
      class="cyber-dialog"
    >
      <el-table
        :data="availableItems"
        class="cyber-table-mini"
        @selection-change="handleItemSelection"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="itemCode" label="商品编码" width="120" />
        <el-table-column prop="itemName" label="商品名称" />
        <el-table-column prop="currentStock" label="当前库存" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
      </el-table>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="cyber-button-secondary" @click="showSelectItemDialog = false">取消</el-button>
          <el-button type="primary" class="cyber-button" @click="handleAddItems">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const searchForm = reactive({
  transferNo: '',
  status: '',
  sourceWarehouse: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const createForm = reactive({
  sourceWarehouse: '',
  targetWarehouse: '',
  reason: '',
  items: []
})

const createRules = {
  sourceWarehouse: [
    { required: true, message: '请选择源库区', trigger: 'change' }
  ],
  targetWarehouse: [
    { required: true, message: '请选择目标库区', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入调拨原因', trigger: 'blur' }
  ]
}

const transferList = ref([])
const selectedTransfers = ref([])
const showCreateDialog = ref(false)
const showSelectItemDialog = ref(false)
const availableItems = ref([])
const selectedItems = ref([])
const createFormRef = ref()

// 模拟数据
const mockTransferList = [
  {
    id: 1,
    transferNo: 'TF202601070001',
    sourceWarehouse: 'A',
    targetWarehouse: 'B',
    itemCount: 5,
    totalQuantity: 120,
    status: 'pending',
    createTime: '2026-01-07 09:30:00',
    operator: '张三'
  },
  {
    id: 2,
    transferNo: 'TF202601070002',
    sourceWarehouse: 'B',
    targetWarehouse: 'C',
    itemCount: 3,
    totalQuantity: 80,
    status: 'approved',
    createTime: '2026-01-07 10:15:00',
    operator: '李四'
  },
  {
    id: 3,
    transferNo: 'TF202601070003',
    sourceWarehouse: 'C',
    targetWarehouse: 'D',
    itemCount: 8,
    totalQuantity: 200,
    status: 'transferring',
    createTime: '2026-01-07 08:45:00',
    operator: '王五'
  },
  {
    id: 4,
    transferNo: 'TF202601070004',
    sourceWarehouse: 'D',
    targetWarehouse: 'A',
    itemCount: 2,
    totalQuantity: 50,
    status: 'completed',
    createTime: '2026-01-06 16:20:00',
    operator: '赵六'
  }
]

const mockAvailableItems = [
  { itemCode: 'P001', itemName: '笔记本电脑', currentStock: 50, unit: '台' },
  { itemCode: 'P002', itemName: '无线鼠标', currentStock: 200, unit: '个' },
  { itemCode: 'P003', itemName: '机械键盘', currentStock: 80, unit: '个' },
  { itemCode: 'P004', itemName: '显示器', currentStock: 30, unit: '台' },
  { itemCode: 'P005', itemName: '打印机', currentStock: 15, unit: '台' }
]

// 方法
const getStatusType = (status) => {
  const statusMap = {
    pending: 'warning',
    approved: 'info',
    transferring: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待审核',
    approved: '已审核',
    transferring: '调拨中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || '未知'
}

const handleSearch = () => {
  // 模拟搜索
  console.log('搜索条件:', searchForm)
  loadTransferList()
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  loadTransferList()
}

const handleSelectionChange = (selection) => {
  selectedTransfers.value = selection
}

const handleView = (row) => {
  ElMessage.info(`查看调拨单: ${row.transferNo}`)
}

const handleApprove = (row) => {
  ElMessageBox.confirm(
    `确定要审核通过调拨单 ${row.transferNo} 吗？`,
    '确认审核',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = 'approved'
    ElMessage.success('审核成功')
  })
}

const handleExecute = (row) => {
  ElMessageBox.confirm(
    `确定要执行调拨单 ${row.transferNo} 吗？`,
    '确认执行',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = 'transferring'
    ElMessage.success('调拨执行中')
    // 模拟调拨过程
    setTimeout(() => {
      row.status = 'completed'
      ElMessage.success('调拨完成')
    }, 3000)
  })
}

const handleCancel = (row) => {
  ElMessageBox.confirm(
    `确定要取消调拨单 ${row.transferNo} 吗？`,
    '确认取消',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    row.status = 'cancelled'
    ElMessage.success('调拨单已取消')
  })
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadTransferList()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadTransferList()
}

const handleCloseDialog = () => {
  showCreateDialog.value = false
  resetCreateForm()
}

const resetCreateForm = () => {
  Object.keys(createForm).forEach(key => {
    if (key === 'items') {
      createForm[key] = []
    } else {
      createForm[key] = ''
    }
  })
}

const handleCreate = () => {
  createFormRef.value.validate((valid) => {
    if (valid) {
      if (createForm.items.length === 0) {
        ElMessage.warning('请添加调拨商品')
        return
      }
      
      // 模拟创建调拨单
      const newTransfer = {
        id: Date.now(),
        transferNo: `TF${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}${String(transferList.value.length + 1).padStart(4, '0')}`,
        sourceWarehouse: createForm.sourceWarehouse,
        targetWarehouse: createForm.targetWarehouse,
        itemCount: createForm.items.length,
        totalQuantity: createForm.items.reduce((sum, item) => sum + item.transferQuantity, 0),
        status: 'pending',
        createTime: new Date().toLocaleString(),
        operator: '当前用户'
      }
      
      transferList.value.unshift(newTransfer)
      pagination.total++
      
      ElMessage.success('调拨单创建成功')
      handleCloseDialog()
    }
  })
}

const handleItemSelection = (selection) => {
  selectedItems.value = selection
}

const handleAddItems = () => {
  selectedItems.value.forEach(item => {
    if (!createForm.items.find(existItem => existItem.itemCode === item.itemCode)) {
      createForm.items.push({
        ...item,
        transferQuantity: 1
      })
    }
  })
  showSelectItemDialog.value = false
  selectedItems.value = []
}

const removeItem = (index) => {
  createForm.items.splice(index, 1)
}

const loadTransferList = () => {
  // 模拟加载数据
  transferList.value = [...mockTransferList]
  pagination.total = mockTransferList.length
}

const loadAvailableItems = () => {
  availableItems.value = [...mockAvailableItems]
}

// 生命周期
onMounted(() => {
  loadTransferList()
  loadAvailableItems()
})
</script>

<style lang="scss" scoped>
.stock-transfer {
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

  .transfer-list {
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-cyber);
    padding: 20px;

    .transfer-no {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: var(--primary-color);
    }

    .warehouse-tag {
      font-weight: 600;
    }

    .quantity {
      font-weight: 600;
      color: var(--success-color);
    }

    .status-tag {
      font-weight: 600;
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }

  .create-form {
    .item-list {
      .add-item-btn {
        margin-top: 12px;
        width: 100%;
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
  .stock-transfer {
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

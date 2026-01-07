<template>
  <div class="outbound-picking-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>卷材出库智能拣选管理</h2>
      <p class="page-description">智能拣选策略，优化出库效率，实现FIFO出库管理</p>
    </div>

    <!-- 功能操作区 -->
    <div class="operation-panel">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-button type="primary" @click="showCreateOrderDialog" icon="Plus">
            创建出库单
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="success" @click="showBatchProcessDialog" icon="Operation">
            批量处理
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="info" @click="refreshData" icon="Refresh">
            刷新数据
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="warning" @click="showStatisticsDialog" icon="DataAnalysis">
            统计分析
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-panel">
      <el-form :model="searchForm" inline>
        <el-form-item label="出库单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入出库单号" clearable />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="拣选中" value="picking" />
            <el-option label="已拣选" value="picked" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="Search">搜索</el-button>
          <el-button @click="resetSearch" icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 出库单列表 -->
    <div class="table-container">
      <el-table
        :data="outboundList"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="orderNo" label="出库单号" width="180" />
        <el-table-column prop="customerName" label="客户名称" width="150" />
        <el-table-column prop="totalQuantity" label="总数量" width="100" />
        <el-table-column prop="totalAmount" label="总金额" width="120">
          <template #default="scope">
            ¥{{ scope.row.totalAmount?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="estimatedTime" label="预估时间" width="100">
          <template #default="scope">
            {{ scope.row.estimatedTime || 0 }}分钟
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 'pending'"
              type="primary"
              size="small"
              @click="handlePickingRecommendation(scope.row)"
            >
              拣选推荐
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="success"
              size="small"
              @click="handleExecutePicking(scope.row)"
            >
              执行拣选
            </el-button>
            <el-button
              type="info"
              size="small"
              @click="handleViewDetails(scope.row)"
            >
              查看详情
            </el-button>
            <el-button
              v-if="scope.row.status === 'picked'"
              type="warning"
              size="small"
              @click="handleGenerateDocument(scope.row)"
            >
              生成单据
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建出库单对话框 -->
    <el-dialog
      v-model="createOrderDialog.visible"
      title="创建出库单"
      width="800px"
      :before-close="handleCloseCreateDialog"
    >
      <el-form
        ref="createOrderFormRef"
        :model="createOrderForm"
        :rules="createOrderRules"
        label-width="120px"
      >
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="createOrderForm.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="createOrderForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="收货地址" prop="deliveryAddress">
          <el-input
            v-model="createOrderForm.deliveryAddress"
            type="textarea"
            :rows="2"
            placeholder="请输入收货地址"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="createOrderForm.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
        <el-form-item label="出库商品">
          <div class="items-container">
            <div
              v-for="(item, index) in createOrderForm.items"
              :key="index"
              class="item-row"
            >
              <el-row :gutter="10">
                <el-col :span="8">
                  <el-input
                    v-model="item.materialCode"
                    placeholder="物料编码"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input-number
                    v-model="item.quantity"
                    :min="1"
                    placeholder="数量"
                    style="width: 100%"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input-number
                    v-model="item.price"
                    :min="0"
                    :precision="2"
                    placeholder="单价"
                    style="width: 100%"
                  />
                </el-col>
                <el-col :span="4">
                  <el-button
                    type="danger"
                    size="small"
                    @click="removeItem(index)"
                    icon="Delete"
                  >
                    删除
                  </el-button>
                </el-col>
              </el-row>
            </div>
            <el-button
              type="primary"
              size="small"
              @click="addItem"
              icon="Plus"
              style="margin-top: 10px"
            >
              添加商品
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createOrderDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateOrder" :loading="createOrderDialog.loading">
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 拣选推荐对话框 -->
    <el-dialog
      v-model="pickingRecommendationDialog.visible"
      title="智能拣选推荐"
      width="1000px"
    >
      <div class="recommendation-container">
        <div class="strategy-selector">
          <el-form inline>
            <el-form-item label="拣选策略">
              <el-select v-model="selectedStrategy" @change="handleStrategyChange">
                <el-option label="先进先出(FIFO)" value="fifo" />
                <el-option label="后进先出(LIFO)" value="lifo" />
                <el-option label="就近拣选" value="nearest" />
                <el-option label="批次拣选" value="batch" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generateRecommendation">
                生成推荐
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="pickingRecommendation" class="recommendation-result">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card title="拣选统计">
                <div class="stats-item">
                  <span>总商品数：</span>
                  <span class="stats-value">{{ pickingRecommendation.totalItems }}</span>
                </div>
                <div class="stats-item">
                  <span>预估时间：</span>
                  <span class="stats-value">{{ pickingRecommendation.estimatedTime }}分钟</span>
                </div>
                <div class="stats-item">
                  <span>拣选路径：</span>
                  <span class="stats-value">{{ pickingRecommendation.pickingPath?.length || 0 }}个库位</span>
                </div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card title="拣选路径">
                <div class="picking-path">
                  <div
                    v-for="(path, index) in pickingRecommendation.pickingPath"
                    :key="index"
                    class="path-item"
                  >
                    {{ index + 1 }}. {{ path.location }} - {{ path.materialCode }} ({{ path.quantity }})
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-table
            :data="pickingRecommendation.recommendations"
            style="width: 100%; margin-top: 20px"
            border
          >
            <el-table-column prop="materialCode" label="物料编码" width="150" />
            <el-table-column prop="requestedQuantity" label="需求数量" width="100" />
            <el-table-column label="分配明细">
              <template #default="scope">
                <div
                  v-for="(alloc, index) in scope.row.allocation"
                  :key="index"
                  class="allocation-item"
                >
                  库位: {{ alloc.location }} | 批次: {{ alloc.batchNo }} | 数量: {{ alloc.quantity }}
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="pickingRecommendationDialog.visible = false">关闭</el-button>
          <el-button
            v-if="pickingRecommendation"
            type="primary"
            @click="handleConfirmPicking"
          >
            确认拣选
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 统计分析对话框 -->
    <el-dialog
      v-model="statisticsDialog.visible"
      title="出库统计分析"
      width="800px"
    >
      <div class="statistics-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-title">总出库单数</div>
              <div class="stat-value">{{ statistics.totalOrders }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-title">总出库数量</div>
              <div class="stat-value">{{ statistics.totalQuantity }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-title">总出库金额</div>
              <div class="stat-value">¥{{ statistics.totalAmount?.toFixed(2) || '0.00' }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="stat-title">平均拣选时间</div>
              <div class="stat-value">{{ statistics.avgPickingTime }}分钟</div>
            </div>
          </el-col>
        </el-row>

        <div class="chart-container" style="margin-top: 20px">
          <div ref="statisticsChart" style="width: 100%; height: 300px"></div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statisticsDialog.visible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import outboundService, { OUTBOUND_STATUS, PICKING_STRATEGY } from '@/services/outboundService'

// 响应式数据
const loading = ref(false)
const outboundList = ref([])
const selectedRows = ref([])

// 搜索表单
const searchForm = reactive({
  orderNo: '',
  customerName: '',
  status: '',
  dateRange: []
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 创建出库单对话框
const createOrderDialog = reactive({
  visible: false,
  loading: false
})

const createOrderFormRef = ref()
const createOrderForm = reactive({
  customerName: '',
  contactPhone: '',
  deliveryAddress: '',
  notes: '',
  items: [
    {
      materialCode: '',
      quantity: 1,
      price: 0
    }
  ]
})

const createOrderRules = {
  customerName: [
    { required: true, message: '请输入客户名称', trigger: 'blur' }
  ],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' }
  ],
  deliveryAddress: [
    { required: true, message: '请输入收货地址', trigger: 'blur' }
  ]
}

// 拣选推荐对话框
const pickingRecommendationDialog = reactive({
  visible: false
})

const selectedStrategy = ref('fifo')
const pickingRecommendation = ref(null)
const currentOrder = ref(null)

// 统计分析对话框
const statisticsDialog = reactive({
  visible: false
})

const statistics = ref({
  totalOrders: 0,
  totalQuantity: 0,
  totalAmount: 0,
  avgPickingTime: 0,
  pickingEfficiency: 0,
  statusDistribution: {},
  dailyTrend: []
})

const statisticsChart = ref()

// 生命周期
onMounted(() => {
  loadOutboundList()
})

// 方法
const loadOutboundList = async () => {
  loading.value = true
  try {
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 500))
    
    outboundList.value = [
      {
        orderNo: 'OUT-20260107-124500-001',
        customerName: '华东纺织有限公司',
        totalQuantity: 150,
        totalAmount: 45000,
        status: 'pending',
        estimatedTime: 25,
        createTime: '2026-01-07T12:45:00Z',
        items: [
          { materialCode: 'YP-ZCM-2.0-20260107-001', quantity: 100, price: 200 },
          { materialCode: 'YP-ZCM-1.5-20260107-002', quantity: 50, price: 500 }
        ]
      },
      {
        orderNo: 'OUT-20260107-113000-002',
        customerName: '江南过滤设备厂',
        totalQuantity: 80,
        totalAmount: 24000,
        status: 'picking',
        estimatedTime: 15,
        createTime: '2026-01-07T11:30:00Z',
        items: [
          { materialCode: 'YP-JZB-1.8-20260107-003', quantity: 80, price: 300 }
        ]
      }
    ]
    
    pagination.total = outboundList.value.length
  } catch (error) {
    ElMessage.error('加载出库单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadOutboundList()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    orderNo: '',
    customerName: '',
    status: '',
    dateRange: []
  })
  handleSearch()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadOutboundList()
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
  loadOutboundList()
}

const refreshData = () => {
  loadOutboundList()
}

// 创建出库单相关方法
const showCreateOrderDialog = () => {
  createOrderDialog.visible = true
}

const handleCloseCreateDialog = () => {
  createOrderFormRef.value?.resetFields()
  createOrderForm.items = [{ materialCode: '', quantity: 1, price: 0 }]
  createOrderDialog.visible = false
}

const addItem = () => {
  createOrderForm.items.push({
    materialCode: '',
    quantity: 1,
    price: 0
  })
}

const removeItem = (index) => {
  if (createOrderForm.items.length > 1) {
    createOrderForm.items.splice(index, 1)
  }
}

const handleCreateOrder = async () => {
  try {
    await createOrderFormRef.value?.validate()
    
    createOrderDialog.loading = true
    
    const result = await outboundService.createOutboundOrder(createOrderForm)
    
    if (result.success) {
      ElMessage.success(result.message)
      createOrderDialog.visible = false
      handleCloseCreateDialog()
      loadOutboundList()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('表单验证失败')
  } finally {
    createOrderDialog.loading = false
  }
}

// 拣选推荐相关方法
const handlePickingRecommendation = (order) => {
  currentOrder.value = order
  pickingRecommendationDialog.visible = true
  generateRecommendation()
}

const handleStrategyChange = () => {
  if (currentOrder.value) {
    generateRecommendation()
  }
}

const generateRecommendation = async () => {
  if (!currentOrder.value) return
  
  try {
    const result = await outboundService.getPickingRecommendation(
      currentOrder.value.items,
      selectedStrategy.value
    )
    
    if (result.success) {
      pickingRecommendation.value = result.data
      ElMessage.success(result.message)
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('生成拣选推荐失败')
  }
}

const handleConfirmPicking = async () => {
  if (!currentOrder.value || !pickingRecommendation.value) return
  
  try {
    const result = await outboundService.executePicking(
      currentOrder.value.orderNo,
      pickingRecommendation.value.recommendations
    )
    
    if (result.success) {
      ElMessage.success(result.message)
      pickingRecommendationDialog.visible = false
      loadOutboundList()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('执行拣选失败')
  }
}

const handleExecutePicking = (order) => {
  handlePickingRecommendation(order)
}

const handleViewDetails = (order) => {
  ElMessageBox.alert(
    `出库单号：${order.orderNo}\n客户名称：${order.customerName}\n总数量：${order.totalQuantity}\n总金额：¥${order.totalAmount?.toFixed(2)}`,
    '出库单详情',
    { confirmButtonText: '确定' }
  )
}

const handleGenerateDocument = async (order) => {
  try {
    const result = await outboundService.generateOutboundDocument(order.orderNo)
    
    if (result.success) {
      ElMessage.success(result.message)
      // 这里可以添加打印或下载逻辑
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('生成出库单失败')
  }
}

// 批量处理
const showBatchProcessDialog = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要处理的出库单')
    return
  }
  
  ElMessageBox.confirm(
    `确定要批量处理选中的 ${selectedRows.value.length} 个出库单吗？`,
    '批量处理确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const result = await outboundService.batchOutbound(selectedRows.value)
      
      if (result.success) {
        ElMessage.success(result.message)
        loadOutboundList()
      } else {
        ElMessage.error(result.message)
      }
    } catch (error) {
      ElMessage.error('批量处理失败')
    }
  })
}

// 统计分析
const showStatisticsDialog = async () => {
  statisticsDialog.visible = true
  
  try {
    const result = await outboundService.getOutboundStatistics()
    
    if (result.success) {
      statistics.value = result.data
      
      // 渲染图表
      nextTick(() => {
        renderStatisticsChart()
      })
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

const renderStatisticsChart = () => {
  if (!statisticsChart.value) return
  
  const chart = echarts.init(statisticsChart.value)
  
  const option = {
    title: {
      text: '出库趋势分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['出库单数', '出库数量'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: statistics.value.dailyTrend?.map(item => item.date) || []
    },
    yAxis: [
      {
        type: 'value',
        name: '出库单数'
      },
      {
        type: 'value',
        name: '出库数量'
      }
    ],
    series: [
      {
        name: '出库单数',
        type: 'line',
        data: statistics.value.dailyTrend?.map(item => item.orders) || []
      },
      {
        name: '出库数量',
        type: 'bar',
        yAxisIndex: 1,
        data: statistics.value.dailyTrend?.map(item => item.quantity) || []
      }
    ]
  }
  
  chart.setOption(option)
}

// 工具方法
const getStatusType = (status) => {
  const statusMap = {
    pending: '',
    picking: 'warning',
    picked: 'success',
    shipped: 'info',
    cancelled: 'danger'
  }
  return statusMap[status] || ''
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    picking: '拣选中',
    picked: '已拣选',
    shipped: '已发货',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  return new Date(dateTime).toLocaleString('zh-CN')
}
</script>

<style scoped>
.outbound-picking-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.operation-panel {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.search-panel {
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pagination-container {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}

.items-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
}

.item-row {
  margin-bottom: 10px;
}

.item-row:last-child {
  margin-bottom: 0;
}

.recommendation-container {
  max-height: 600px;
  overflow-y: auto;
}

.strategy-selector {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.recommendation-result {
  margin-top: 20px;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.stats-value {
  font-weight: bold;
  color: #409eff;
}

.picking-path {
  max-height: 200px;
  overflow-y: auto;
}

.path-item {
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.allocation-item {
  padding: 2px 0;
  font-size: 12px;
  color: #666;
}

.statistics-container {
  padding: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.chart-container {
  margin-top: 20px;
}
</style>

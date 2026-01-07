<template>
  <div class="electrical-component-management">
    <!-- 电流粒子背景 -->
    <div class="electrical-particles-bg"></div>
    
    <!-- 页面标题 -->
    <div class="page-header glass-card">
      <div class="header-content">
        <h1 class="neon-text">⚡ 腾腾电气元器件管理系统</h1>
        <p class="subtitle">Industrial Electrical Component Management System</p>
      </div>
      <div class="header-stats">
        <div class="stat-item floating-3d">
          <div class="stat-value">{{ stats.totalComponents }}</div>
          <div class="stat-label">总元器件数</div>
        </div>
        <div class="stat-item floating-3d">
          <div class="stat-value">¥{{ formatNumber(stats.totalValue) }}</div>
          <div class="stat-label">总价值</div>
        </div>
        <div class="stat-item floating-3d">
          <div class="stat-value">{{ stats.lowStockAlerts }}</div>
          <div class="stat-label">低库存预警</div>
        </div>
      </div>
    </div>

    <!-- 功能选项卡 -->
    <el-tabs v-model="activeTab" class="electric-tabs" @tab-change="handleTabChange">
      
      <!-- 元器件列表 -->
      <el-tab-pane label="📦 元器件库存" name="inventory">
        <div class="tab-content glass-card">
          
          <!-- 搜索和筛选 -->
          <div class="search-filters circuit-pattern">
            <div class="filter-row">
              <el-input
                v-model="searchQuery"
                placeholder="搜索元器件名称、型号、序列号..."
                prefix-icon="Search"
                class="search-input"
                @input="handleSearch"
              />
              <el-select v-model="categoryFilter" placeholder="选择类别" class="filter-select">
                <el-option label="全部类别" value=""></el-option>
                <el-option label="集成电路(IC)" value="IC"></el-option>
                <el-option label="电阻(Resistor)" value="Resistor"></el-option>
                <el-option label="电容(Capacitor)" value="Capacitor"></el-option>
                <el-option label="开关(Switch)" value="Switch"></el-option>
                <el-option label="连接器(Connector)" value="Connector"></el-option>
              </el-select>
              <el-select v-model="voltageFilter" placeholder="电压等级" class="filter-select">
                <el-option label="全部电压" value=""></el-option>
                <el-option label="高压(≥1kV)" value="high-voltage"></el-option>
                <el-option label="低压(50V-1kV)" value="low-voltage"></el-option>
                <el-option label="安全电压(<50V)" value="safe-voltage"></el-option>
              </el-select>
              <el-button type="primary" class="electric-button" @click="addComponent">
                <Plus /> 添加元器件
              </el-button>
            </div>
          </div>

          <!-- 元器件表格 -->
          <div class="component-table data-flow">
            <el-table
              :data="filteredComponents"
              v-loading="loading"
              element-loading-text="正在加载电气元器件数据..."
              element-loading-background="rgba(10, 14, 26, 0.8)"
              stripe
              @row-click="viewComponentDetail"
            >
              <el-table-column prop="id" label="元器件ID" width="120" fixed="left">
                <template #default="{ row }">
                  <span class="component-id">{{ row.id }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="name" label="名称" width="150">
                <template #default="{ row }">
                  <div class="component-name">
                    <strong>{{ row.name }}</strong>
                    <div class="model">{{ row.model }}</div>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="category" label="类别" width="100">
                <template #default="{ row }">
                  <el-tag :type="getCategoryTagType(row.category)">
                    {{ row.category }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column prop="voltage" label="电压等级" width="120">
                <template #default="{ row }">
                  <div class="voltage-info">
                    <span class="voltage-badge" :class="row.voltageLevel">
                      {{ row.voltage }}
                    </span>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="mslLevel" label="MSL等级" width="80">
                <template #default="{ row }">
                  <span class="msl-badge" :class="`msl-${row.mslLevel}`">
                    MSL-{{ row.mslLevel }}
                  </span>
                </template>
              </el-table-column>
              
              <el-table-column prop="esdRequired" label="ESD防护" width="80">
                <template #default="{ row }">
                  <span v-if="row.esdRequired" class="esd-badge">ESD</span>
                  <span v-else class="no-esd">-</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="quantity" label="库存数量" width="100">
                <template #default="{ row }">
                  <span :class="{ 'low-stock': row.quantity < 100 }">
                    {{ formatNumber(row.quantity) }}
                  </span>
                </template>
              </el-table-column>
              
              <el-table-column prop="location" label="存储位置" width="120">
                <template #default="{ row }">
                  <span class="location-code">{{ row.location }}</span>
                </template>
              </el-table-column>
              
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" @click.stop="viewComponentDetail(row)">
                    <View /> 详情
                  </el-button>
                  <el-button size="small" type="primary" @click.stop="editComponent(row)">
                    <Edit /> 编辑
                  </el-button>
                  <el-button size="small" type="danger" @click.stop="deleteComponent(row)">
                    <Delete /> 删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 3D可视化 -->
      <el-tab-pane label="🏗️ 3D仓储可视化" name="3d-warehouse">
        <div class="tab-content glass-card">
          <div class="warehouse-3d-container">
            <div class="warehouse-controls">
              <el-button-group>
                <el-button @click="reset3DView">重置视角</el-button>
                <el-button @click="toggleHeatmap">{{ showHeatmap ? '关闭' : '开启' }}热力图</el-button>
                <el-button @click="toggleARMode">AR拣货模式</el-button>
              </el-button-group>
            </div>
            <div id="warehouse3d" class="warehouse-3d-scene"></div>
            
            <!-- 热力图图例 -->
            <div v-if="showHeatmap" class="heatmap-legend glass-card">
              <h4>周转率热力图</h4>
              <div class="legend-items">
                <div class="legend-item">
                  <span class="color-box" style="background: #ff4d4f"></span>
                  <span>高频(>6次/月)</span>
                </div>
                <div class="legend-item">
                  <span class="color-box" style="background: #fa8c16"></span>
                  <span>中频(3-6次/月)</span>
                </div>
                <div class="legend-item">
                  <span class="color-box" style="background: #fadb14"></span>
                  <span>低频(1-3次/月)</span>
                </div>
                <div class="legend-item">
                  <span class="color-box" style="background: #52c41a"></span>
                  <span>极低(<1次/月)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 统计分析 -->
      <el-tab-pane label="📊 统计分析" name="analytics">
        <div class="tab-content">
          <div class="analytics-grid">
            
            <!-- 库存分布 -->
            <div class="chart-card glass-card floating-3d">
              <h3>📈 库存分布统计</h3>
              <div id="categoryChart" class="chart-container"></div>
            </div>
            
            <!-- 电压等级分布 -->
            <div class="chart-card glass-card floating-3d">
              <h3>⚡ 电压等级分布</h3>
              <div id="voltageChart" class="chart-container"></div>
            </div>
            
            <!-- MSL等级分布 -->
            <div class="chart-card glass-card floating-3d">
              <h3>💧 MSL湿度等级分布</h3>
              <div id="mslChart" class="chart-container"></div>
            </div>
            
            <!-- 周转率趋势 -->
            <div class="chart-card glass-card floating-3d full-width">
              <h3>🔄 元器件周转率趋势</h3>
              <div id="turnoverChart" class="chart-container"></div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 质量追溯 -->
      <el-tab-pane label="🔍 质量追溯" name="traceability">
        <div class="tab-content glass-card">
          <div class="traceability-search">
            <el-input
              v-model="traceabilityQuery"
              placeholder="输入序列号或批次号进行追溯..."
              prefix-icon="Search"
              class="trace-input"
              @keyup.enter="performTraceability"
            />
            <el-button type="primary" class="electric-button" @click="performTraceability">
              <Search /> 开始追溯
            </el-button>
          </div>
          
          <div v-if="traceabilityResult" class="traceability-result">
            <div class="trace-timeline">
              <h3>🔗 全生命周期追溯</h3>
              <el-timeline>
                <el-timeline-item
                  v-for="(item, index) in traceabilityResult.lifecycle"
                  :key="index"
                  :timestamp="item.date"
                  :type="getTimelineType(item.stage)"
                >
                  <div class="timeline-content">
                    <h4>{{ getStageText(item.stage) }}</h4>
                    <p>操作员: {{ item.operator }}</p>
                    <p>备注: {{ item.notes }}</p>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
            
            <div class="trace-details">
              <div class="detail-card glass-card">
                <h4>📋 基本信息</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>序列号:</label>
                    <span>{{ traceabilityResult.serialNumber }}</span>
                  </div>
                  <div class="detail-item">
                    <label>批次号:</label>
                    <span>{{ traceabilityResult.batchNumber }}</span>
                  </div>
                  <div class="detail-item">
                    <label>制造商:</label>
                    <span>{{ traceabilityResult.manufacturer }}</span>
                  </div>
                </div>
              </div>
              
              <div class="detail-card glass-card">
                <h4>🏭 安装信息</h4>
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>安装位置:</label>
                    <span>{{ traceabilityResult.installInfo.location || '未安装' }}</span>
                  </div>
                  <div class="detail-item">
                    <label>GPS坐标:</label>
                    <span>{{ traceabilityResult.installInfo.gpsCoordinates || '无' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 元器件详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="元器件详细信息"
      width="80%"
      class="component-detail-dialog"
    >
      <div v-if="selectedComponent" class="component-detail">
        <div class="detail-header">
          <h2>{{ selectedComponent.name }}</h2>
          <div class="badges">
            <span class="voltage-badge" :class="selectedComponent.voltageLevel">
              {{ selectedComponent.voltage }}
            </span>
            <span class="msl-badge" :class="`msl-${selectedComponent.mslLevel}`">
              MSL-{{ selectedComponent.mslLevel }}
            </span>
            <span v-if="selectedComponent.esdRequired" class="esd-badge">ESD</span>
          </div>
        </div>
        
        <el-tabs>
          <el-tab-pane label="基本信息" name="basic">
            <div class="basic-info-grid">
              <div class="info-item">
                <label>元器件ID:</label>
                <span>{{ selectedComponent.id }}</span>
              </div>
              <div class="info-item">
                <label>型号:</label>
                <span>{{ selectedComponent.model }}</span>
              </div>
              <div class="info-item">
                <label>制造商:</label>
                <span>{{ selectedComponent.manufacturer }}</span>
              </div>
              <div class="info-item">
                <label>序列号:</label>
                <span>{{ selectedComponent.serialNumber }}</span>
              </div>
              <div class="info-item">
                <label>批次号:</label>
                <span>{{ selectedComponent.batchNumber }}</span>
              </div>
              <div class="info-item">
                <label>库存数量:</label>
                <span>{{ formatNumber(selectedComponent.quantity) }}</span>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="存储条件" name="storage">
            <div class="storage-conditions">
              <div class="condition-item">
                <label>当前温度:</label>
                <span>{{ selectedComponent.temperature }}</span>
              </div>
              <div class="condition-item">
                <label>当前湿度:</label>
                <span>{{ selectedComponent.humidity }}</span>
              </div>
              <div class="condition-item">
                <label>存储位置:</label>
                <span>{{ selectedComponent.location }}</span>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="质量信息" name="quality">
            <div class="quality-info">
              <div class="quality-item">
                <label>质检报告:</label>
                <el-button type="primary" size="small" @click="downloadQualityReport">
                  <Download /> {{ selectedComponent.qualityReport }}
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 添加/编辑元器件弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="isEditing ? '编辑元器件' : '添加元器件'"
      width="60%"
      class="component-edit-dialog"
    >
      <el-form :model="componentForm" :rules="formRules" ref="componentFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="元器件名称" prop="name">
              <el-input v-model="componentForm.name" placeholder="请输入元器件名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类别" prop="category">
              <el-select v-model="componentForm.category" placeholder="选择类别">
                <el-option label="集成电路(IC)" value="IC"></el-option>
                <el-option label="电阻(Resistor)" value="Resistor"></el-option>
                <el-option label="电容(Capacitor)" value="Capacitor"></el-option>
                <el-option label="开关(Switch)" value="Switch"></el-option>
                <el-option label="连接器(Connector)" value="Connector"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="型号" prop="model">
              <el-input v-model="componentForm.model" placeholder="请输入型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="制造商" prop="manufacturer">
              <el-input v-model="componentForm.manufacturer" placeholder="请输入制造商" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="电压" prop="voltage">
              <el-input v-model="componentForm.voltage" placeholder="如: 3.3V" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="MSL等级" prop="mslLevel">
              <el-select v-model="componentForm.mslLevel" placeholder="选择MSL等级">
                <el-option label="MSL-1" :value="1"></el-option>
                <el-option label="MSL-2" :value="2"></el-option>
                <el-option label="MSL-3" :value="3"></el-option>
                <el-option label="MSL-4" :value="4"></el-option>
                <el-option label="MSL-5" :value="5"></el-option>
                <el-option label="MSL-6" :value="6"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="ESD防护">
              <el-switch v-model="componentForm.esdRequired" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="componentForm.quantity" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存储位置" prop="location">
              <el-input v-model="componentForm.location" placeholder="如: A01-01-01" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" class="electric-button" @click="saveComponent">
          {{ isEditing ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, View, Edit, Delete, Download } from '@element-plus/icons-vue'
import electricalComponentService from '@/services/electricalComponentService'
import * as echarts from 'echarts'

export default {
  name: 'ElectricalComponentManagement',
  components: {
    Plus, Search, View, Edit, Delete, Download
  },
  setup() {
    // 响应式数据
    const activeTab = ref('inventory')
    const loading = ref(false)
    const components = ref([])
    const stats = ref({
      totalComponents: 0,
      totalValue: 0,
      lowStockAlerts: 0
    })
    
    // 搜索和筛选
    const searchQuery = ref('')
    const categoryFilter = ref('')
    const voltageFilter = ref('')
    
    // 分页
    const currentPage = ref(1)
    const pageSize = ref(20)
    const total = ref(0)
    
    // 弹窗控制
    const detailDialogVisible = ref(false)
    const editDialogVisible = ref(false)
    const selectedComponent = ref(null)
    const isEditing = ref(false)
    
    // 3D可视化
    const showHeatmap = ref(false)
    
    // 质量追溯
    const traceabilityQuery = ref('')
    const traceabilityResult = ref(null)
    
    // 表单数据
    const componentForm = reactive({
      name: '',
      category: '',
      model: '',
      manufacturer: '',
      voltage: '',
      mslLevel: 1,
      esdRequired: false,
      quantity: 0,
      location: ''
    })
    
    // 表单验证规则
    const formRules = {
      name: [{ required: true, message: '请输入元器件名称', trigger: 'blur' }],
      category: [{ required: true, message: '请选择类别', trigger: 'change' }],
      model: [{ required: true, message: '请输入型号', trigger: 'blur' }],
      manufacturer: [{ required: true, message: '请输入制造商', trigger: 'blur' }],
      voltage: [{ required: true, message: '请输入电压', trigger: 'blur' }],
      quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
      location: [{ required: true, message: '请输入存储位置', trigger: 'blur' }]
    }
    
    const componentFormRef = ref(null)
    
    // 计算属性
    const filteredComponents = computed(() => {
      let filtered = components.value
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.model.toLowerCase().includes(query) ||
          item.serialNumber.toLowerCase().includes(query)
        )
      }
      
      if (categoryFilter.value) {
        filtered = filtered.filter(item => item.category === categoryFilter.value)
      }
      
      if (voltageFilter.value) {
        filtered = filtered.filter(item => item.voltageLevel === voltageFilter.value)
      }
      
      return filtered
    })
    
    // 方法
    const loadComponents = async () => {
      loading.value = true
      try {
        const response = await electricalComponentService.getComponentList({
          page: currentPage.value,
          pageSize: pageSize.value
        })
        
        if (response.success) {
          components.value = response.data.list
          total.value = response.data.total
        } else {
          ElMessage.error(response.message)
        }
      } catch (error) {
        ElMessage.error('加载元器件列表失败')
      } finally {
        loading.value = false
      }
    }
    
    const loadStats = async () => {
      try {
        const response = await electricalComponentService.getInventoryStats()
        if (response.success) {
          stats.value = response.data
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    }
    
    const handleTabChange = (tabName) => {
      if (tabName === 'analytics') {
        nextTick(() => {
          initCharts()
        })
      } else if (tabName === '3d-warehouse') {
        nextTick(() => {
          init3DWarehouse()
        })
      }
    }
    
    const handleSearch = () => {
      currentPage.value = 1
    }
    
    const handleSizeChange = (size) => {
      pageSize.value = size
      loadComponents()
    }
    
    const handleCurrentChange = (page) => {
      currentPage.value = page
      loadComponents()
    }
    
    const viewComponentDetail = async (row) => {
      try {
        const response = await electricalComponentService.getComponentDetail(row.id)
        if (response.success) {
          selectedComponent.value = response.data
          detailDialogVisible.value = true
        }
      } catch (error) {
        ElMessage.error('获取元器件详情失败')
      }
    }
    
    const addComponent = () => {
      isEditing.value = false
      resetForm()
      editDialogVisible.value = true
    }
    
    const editComponent = (row) => {
      isEditing.value = true
      Object.assign(componentForm, row)
      editDialogVisible.value = true
    }
    
    const saveComponent = async () => {
      try {
        await componentFormRef.value.validate()
        
        const response = isEditing.value
          ? await electricalComponentService.updateComponent(componentForm.id, componentForm)
          : await electricalComponentService.addComponent(componentForm)
        
        if (response.success) {
          ElMessage.success(response.message)
          editDialogVisible.value = false
          loadComponents()
          loadStats()
        } else {
          ElMessage.error(response.message)
        }
      } catch (error) {
        console.error('保存失败:', error)
      }
    }
    
    const deleteComponent = async (row) => {
      try {
        await ElMessageBox.confirm(
          `确定要删除元器件 "${row.name}" 吗？`,
          '确认删除',
          { type: 'warning' }
        )
        
        const response = await electricalComponentService.deleteComponent(row.id)
        if (response.success) {
          ElMessage.success(response.message)
          loadComponents()
          loadStats()
        } else {
          ElMessage.error(response.message)
        }
      } catch (error) {
        // 用户取消删除
      }
    }
    
    const resetForm = () => {
      Object.assign(componentForm, {
        name: '',
        category: '',
        model: '',
        manufacturer: '',
        voltage: '',
        mslLevel: 1,
        esdRequired: false,
        quantity: 0,
        location: ''
      })
    }
    
    const performTraceability = async () => {
      if (!traceabilityQuery.value.trim()) {
        ElMessage.warning('请输入序列号或批次号')
        return
      }
      
      try {
        const response = await electricalComponentService.getComponentDetail(traceabilityQuery.value)
        if (response.success) {
          traceabilityResult.value = response.data
        } else {
          ElMessage.error('未找到相关追溯信息')
        }
      } catch (error) {
        ElMessage.error('追溯查询失败')
      }
    }
    
    const downloadQualityReport = () => {
      ElMessage.info('质检报告下载功能开发中...')
    }
    
    // 3D仓储可视化
    const init3DWarehouse = () => {
      // 这里将集成Three.js实现3D仓储可视化
      ElMessage.info('3D仓储可视化功能开发中...')
    }
    
    const reset3DView = () => {
      ElMessage.info('重置3D视角')
    }
    
    const toggleHeatmap = () => {
      showHeatmap.value = !showHeatmap.value
    }
    
    const toggleARMode = () => {
      ElMessage.info('AR拣货模式开发中...')
    }
    
    // 图表初始化
    const initCharts = async () => {
      try {
        const response = await electricalComponentService.getInventoryStats()
        if (response.success) {
          initCategoryChart(response.data.categories)
          initVoltageChart(response.data.voltageDistribution)
          initMSLChart(response.data.mslDistribution)
          initTurnoverChart()
        }
      } catch (error) {
        console.error('初始化图表失败:', error)
      }
    }
    
    const initCategoryChart = (data) => {
      const chartDom = document.getElementById('categoryChart')
      if (!chartDom) return
      
      const myChart = echarts.init(chartDom)
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(26, 31, 46, 0.9)',
          borderColor: '#722ed1',
          textStyle: { color: '#ffffff' }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: { color: '#ffffff' }
        },
        series: [
          {
            name: '库存分布',
            type: 'pie',
            radius: '50%',
            data: Object.entries(data).map(([key, value]) => ({
              value: value.count,
              name: key
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      myChart.setOption(option)
    }
    
    const initVoltageChart = (data) => {
      const chartDom = document.getElementById('voltageChart')
      if (!chartDom) return
      
      const myChart = echarts.init(chartDom)
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(26, 31, 46, 0.9)',
          borderColor: '#722ed1',
          textStyle: { color: '#ffffff' }
        },
        xAxis: {
          type: 'category',
          data: ['高压', '低压', '安全电压'],
          axisLabel: { color: '#ffffff' }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#ffffff' }
        },
        series: [
          {
            data: [data['high-voltage'], data['low-voltage'], data['safe-voltage']],
            type: 'bar',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#722ed1' },
                { offset: 1, color: '#1890ff' }
              ])
            }
          }
        ]
      }
      myChart.setOption(option)
    }
    
    const initMSLChart = (data) => {
      const chartDom = document.getElementById('mslChart')
      if (!chartDom) return
      
      const myChart = echarts.init(chartDom)
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(26, 31, 46, 0.9)',
          borderColor: '#722ed1',
          textStyle: { color: '#ffffff' }
        },
        xAxis: {
          type: 'category',
          data: ['MSL-1', 'MSL-2', 'MSL-3', 'MSL-4', 'MSL-5', 'MSL-6'],
          axisLabel: { color: '#ffffff' }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#ffffff' }
        },
        series: [
          {
            data: [
              data['msl-1'], data['msl-2'], data['msl-3'],
              data['msl-4'], data['msl-5'], data['msl-6']
            ],
            type: 'line',
            smooth: true,
            itemStyle: { color: '#52c41a' },
            lineStyle: { color: '#52c41a' }
          }
        ]
      }
      myChart.setOption(option)
    }
    
    const initTurnoverChart = async () => {
      try {
        const response = await electricalComponentService.getTurnoverAnalysis()
        if (!response.success) return
        
        const chartDom = document.getElementById('turnoverChart')
        if (!chartDom) return
        
        const myChart = echarts.init(chartDom)
        const option = {
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(26, 31, 46, 0.9)',
            borderColor: '#722ed1',
            textStyle: { color: '#ffffff' }
          },
          xAxis: {
            type: 'category',
            data: response.data.monthlyTrend.map(item => item.month),
            axisLabel: { color: '#ffffff' }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#ffffff' }
          },
          series: [
            {
              name: '周转率',
              type: 'line',
              data: response.data.monthlyTrend.map(item => item.turnover),
              smooth: true,
              itemStyle: { color: '#fa8c16' },
              lineStyle: { color: '#fa8c16' },
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(250, 140, 22, 0.3)' },
                  { offset: 1, color: 'rgba(250, 140, 22, 0.1)' }
                ])
              }
            }
          ]
        }
        myChart.setOption(option)
      } catch (error) {
        console.error('初始化周转率图表失败:', error)
      }
    }
    
    // 工具方法
    const formatNumber = (num) => {
      return new Intl.NumberFormat('zh-CN').format(num)
    }
    
    const getCategoryTagType = (category) => {
      const typeMap = {
        'IC': 'primary',
        'Resistor': 'success',
        'Capacitor': 'warning',
        'Switch': 'danger',
        'Connector': 'info'
      }
      return typeMap[category] || 'default'
    }
    
    const getStatusTagType = (status) => {
      const typeMap = {
        'in_stock': 'success',
        'installed': 'primary',
        'maintenance': 'warning',
        'scrapped': 'danger'
      }
      return typeMap[status] || 'default'
    }
    
    const getStatusText = (status) => {
      const textMap = {
        'in_stock': '库存中',
        'installed': '已安装',
        'maintenance': '维护中',
        'scrapped': '已报废'
      }
      return textMap[status] || status
    }
    
    const getTimelineType = (stage) => {
      const typeMap = {
        'received': 'primary',
        'quality_check': 'success',
        'stored': 'info',
        'picked': 'warning',
        'installed': 'success'
      }
      return typeMap[stage] || 'primary'
    }
    
    const getStageText = (stage) => {
      const textMap = {
        'received': '货物接收',
        'quality_check': '质量检验',
        'stored': '入库存储',
        'picked': '拣货出库',
        'installed': '设备安装'
      }
      return textMap[stage] || stage
    }
    
    // 生命周期
    onMounted(() => {
      loadComponents()
      loadStats()
    })
    
    return {
      // 响应式数据
      activeTab,
      loading,
      components,
      stats,
      searchQuery,
      categoryFilter,
      voltageFilter,
      currentPage,
      pageSize,
      total,
      detailDialogVisible,
      editDialogVisible,
      selectedComponent,
      isEditing,
      showHeatmap,
      traceabilityQuery,
      traceabilityResult,
      componentForm,
      formRules,
      componentFormRef,
      
      // 计算属性
      filteredComponents,
      
      // 方法
      loadComponents,
      loadStats,
      handleTabChange,
      handleSearch,
      handleSizeChange,
      handleCurrentChange,
      viewComponentDetail,
      addComponent,
      editComponent,
      saveComponent,
      deleteComponent,
      resetForm,
      performTraceability,
      downloadQualityReport,
      init3DWarehouse,
      reset3DView,
      toggleHeatmap,
      toggleARMode,
      initCharts,
      formatNumber,
      getCategoryTagType,
      getStatusTagType,
      getStatusText,
      getTimelineType,
      getStageText
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/glassmorphism-business-theme.scss';

.electrical-component-management {
  min-height: 100vh;
  padding: 20px;
  position: relative;
  background: rgba(10, 22, 40, 0.95);
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px;
    margin-bottom: 20px;
    background: rgba(10, 22, 40, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    border: 1px solid rgba(114, 46, 209, 0.2);
    
    .header-content {
      h1 {
        font-size: 28px;
        margin-bottom: 8px;
        color: #ffffff;
      }
      
      .subtitle {
        color: var(--text-secondary);
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
    }
    
    .header-stats {
      display: flex;
      gap: 30px;
      
      .stat-item {
        text-align: center;
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--electric-glow);
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
    }
  }
  
  .electric-tabs {
    :deep(.el-tabs__header) {
      background: rgba(10, 22, 40, 0.85);
      backdrop-filter: blur(10px);
      border-radius: 12px 12px 0 0;
      padding: 0 20px;
      border: 1px solid rgba(114, 46, 209, 0.2);
      
      .el-tabs__nav-wrap {
        &::after {
          display: none;
        }
      }
      
      .el-tabs__item {
        color: var(--text-secondary);
        font-weight: 600;
        
        &.is-active {
          color: var(--electric-glow);
        }
        
        &:hover {
          color: var(--text-primary);
        }
      }
    }
    
    :deep(.el-tabs__content) {
      padding: 0;
    }
  }
  
  .tab-content {
    padding: 30px;
    margin-top: -1px;
    border-radius: 0 0 16px 16px;
    background: rgba(10, 22, 40, 0.85);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(114, 46, 209, 0.2);
    border-top: none;
  }
  
  .search-filters {
    padding: 20px;
    margin-bottom: 20px;
    background: rgba(10, 22, 40, 0.8);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    border: 1px solid rgba(114, 46, 209, 0.15);
    
    .filter-row {
      display: flex;
      gap: 15px;
      align-items: center;
      
      .search-input {
        flex: 1;
        max-width: 400px;
        
        :deep(.el-input__wrapper) {
          background: rgba(10, 22, 40, 0.9);
          border: 1px solid rgba(114, 46, 209, 0.3);
          
          .el-input__inner {
            color: #ffffff;
            
            &::placeholder {
              color: rgba(255, 255, 255, 0.5);
            }
          }
        }
      }
      
      .filter-select {
        width: 150px;
        
        :deep(.el-select__wrapper) {
          background: rgba(10, 22, 40, 0.9);
          border: 1px solid rgba(114, 46, 209, 0.3);
          
          .el-select__placeholder {
            color: rgba(255, 255, 255, 0.5);
          }
          
          .el-select__selected-item {
            color: #ffffff;
          }
        }
      }
    }
  }
  
  .component-table {
    background: rgba(10, 22, 40, 0.85);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    border: 1px solid rgba(114, 46, 209, 0.2);
    padding: 20px;
    
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
        
        .el-table__row--striped {
          background: rgba(114, 46, 209, 0.05);
        }
      }
    }
    
    .component-id {
      font-family: 'Courier New', monospace;
      color: var(--electric-glow);
      font-weight: 600;
    }
    
    .component-name {
      strong {
        display: block;
        margin-bottom: 4px;
        color: #ffffff;
      }
      
      .model {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
    
    .voltage-info {
      display: flex;
      align-items: center;
    }
    
    .low-stock {
      color: var(--danger-red);
      font-weight: 600;
    }
    
    .location-code {
      font-family: 'Courier New', monospace;
      background: rgba(114, 46, 209, 0.2);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      color: #ffffff;
    }
    
    .no-esd {
      color: var(--text-secondary);
    }
    
    .pagination-wrapper {
      display: flex;
      justify-content: center;
      margin-top: 30px;
      
      :deep(.el-pagination) {
        .el-pager li {
          background: rgba(10, 22, 40, 0.8);
          color: #ffffff;
          border: 1px solid rgba(114, 46, 209, 0.3);
          
          &.is-active {
            background: var(--electric-glow);
            color: #000000;
          }
        }
        
        .btn-prev, .btn-next {
          background: rgba(10, 22, 40, 0.8);
          color: #ffffff;
          border: 1px solid rgba(114, 46, 209, 0.3);
        }
        
        .el-select {
          .el-select__wrapper {
            background: rgba(10, 22, 40, 0.8);
            border: 1px solid rgba(114, 46, 209, 0.3);
            color: #ffffff;
          }
        }
      }
    }
  }
  
  .warehouse-3d-container {
    position: relative;
    
    .warehouse-controls {
      margin-bottom: 20px;
      
      :deep(.el-button-group) {
        .el-button {
          background: rgba(10, 22, 40, 0.8);
          border: 1px solid rgba(114, 46, 209, 0.3);
          color: #ffffff;
          
          &:hover {
            background: rgba(114, 46, 209, 0.3);
          }
        }
      }
    }
    
    .warehouse-3d-scene {
      width: 100%;
      height: 600px;
      background: rgba(10, 22, 40, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      border: 1px solid rgba(114, 46, 209, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      font-size: 18px;
    }
    
    .heatmap-legend {
      position: absolute;
      top: 80px;
      right: 20px;
      padding: 15px;
      width: 200px;
      background: rgba(10, 22, 40, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      border: 1px solid rgba(114, 46, 209, 0.2);
      
      h4 {
        margin-bottom: 10px;
        color: var(--text-primary);
      }
      
      .legend-items {
        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          
          .color-box {
            width: 16px;
            height: 16px;
            border-radius: 2px;
            margin-right: 8px;
          }
          
          span {
            font-size: 12px;
            color: var(--text-secondary);
          }
        }
      }
    }
  }
  
  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    
    .chart-card {
      padding: 20px;
      background: rgba(10, 22, 40, 0.85);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(114, 46, 209, 0.2);
      
      &.full-width {
        grid-column: 1 / -1;
      }
      
      h3 {
        margin-bottom: 20px;
        color: var(--text-primary);
        font-size: 16px;
      }
      
      .chart-container {
        width: 100%;
        height: 300px;
      }
    }
  }
  
  .traceability-search {
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
    
    .trace-input {
      flex: 1;
      max-width: 500px;
      
      :deep(.el-input__wrapper) {
        background: rgba(10, 22, 40, 0.9);
        border: 1px solid rgba(114, 46, 209, 0.3);
        
        .el-input__inner {
          color: #ffffff;
          
          &::placeholder {
            color: rgba(255, 255, 255, 0.5);
          }
        }
      }
    }
  }
  
  .traceability-result {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 30px;
    
    .trace-timeline {
      background: rgba(10, 22, 40, 0.85);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 1px solid rgba(114, 46, 209, 0.2);
      padding: 20px;
      
      h3 {
        margin-bottom: 20px;
        color: var(--text-primary);
      }
      
      :deep(.el-timeline) {
        .el-timeline-item__wrapper {
          .el-timeline-item__content {
            color: #ffffff;
          }
          
          .el-timeline-item__timestamp {
            color: var(--text-secondary);
          }
        }
      }
      
      .timeline-content {
        h4 {
          color: var(--text-primary);
          margin-bottom: 5px;
        }
        
        p {
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 3px;
        }
      }
    }
    
    .trace-details {
      .detail-card {
        padding: 20px;
        margin-bottom: 15px;
        background: rgba(10, 22, 40, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        border: 1px solid rgba(114, 46, 209, 0.2);
        
        h4 {
          margin-bottom: 15px;
          color: var(--text-primary);
        }
        
        .detail-grid {
          .detail-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            
            label {
              color: var(--text-secondary);
              font-size: 14px;
            }
            
            span {
              color: var(--text-primary);
              font-size: 14px;
              font-weight: 500;
            }
          }
        }
      }
    }
  }
  
  // 弹窗样式优化
  :deep(.el-dialog) {
    background: rgba(10, 22, 40, 0.95);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(114, 46, 209, 0.3);
    
    .el-dialog__header {
      background: rgba(10, 22, 40, 0.9);
      border-bottom: 1px solid rgba(114, 46, 209, 0.2);
      
      .el-dialog__title {
        color: #ffffff;
      }
    }
    
    .el-dialog__body {
      background: rgba(10, 22, 40, 0.85);
      color: #ffffff;
    }
    
    .el-dialog__footer {
      background: rgba(10, 22, 40, 0.9);
      border-top: 1px solid rgba(114, 46, 209, 0.2);
    }
  }
  
  .component-detail {
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      
      h2 {
        color: var(--text-primary);
      }
      
      .badges {
        display: flex;
        gap: 10px;
      }
    }
    
    :deep(.el-tabs) {
      .el-tabs__header {
        background: rgba(10, 22, 40, 0.8);
        border-radius: 8px;
        
        .el-tabs__item {
          color: var(--text-secondary);
          
          &.is-active {
            color: var(--electric-glow);
          }
        }
      }
      
      .el-tabs__content {
        background: rgba(10, 22, 40, 0.6);
        border-radius: 8px;
        padding: 20px;
        margin-top: 10px;
      }
    }
    
    .basic-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      
      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid rgba(114, 46, 209, 0.2);
        
        label {
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        span {
          color: var(--text-primary);
        }
      }
    }
    
    .storage-conditions {
      .condition-item {
        display: flex;
        justify-content: space-between;
        padding: 15px 0;
        border-bottom: 1px solid rgba(114, 46, 209, 0.2);
        
        label {
          color: var(--text-secondary);
          font-weight: 500;
        }
        
        span {
          color: var(--text-primary);
        }
      }
    }
    
    .quality-info {
      .quality-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 0;
        
        label {
          color: var(--text-secondary);
          font-weight: 500;
        }
      }
    }
  }
  
  // 表单样式优化
  :deep(.el-form) {
    .el-form-item__label {
      color: #ffffff;
    }
    
    .el-input__wrapper {
      background: rgba(10, 22, 40, 0.8);
      border: 1px solid rgba(114, 46, 209, 0.3);
      
      .el-input__inner {
        color: #ffffff;
        
        &::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }
    
    .el-select__wrapper {
      background: rgba(10, 22, 40, 0.8);
      border: 1px solid rgba(114, 46, 209, 0.3);
      
      .el-select__placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
      
      .el-select__selected-item {
        color: #ffffff;
      }
    }
    
    .el-input-number {
      .el-input__wrapper {
        background: rgba(10, 22, 40, 0.8);
        border: 1px solid rgba(114, 46, 209, 0.3);
        
        .el-input__inner {
          color: #ffffff;
        }
      }
    }
    
    .el-switch {
      .el-switch__core {
        background: rgba(114, 46, 209, 0.3);
        
        &.is-checked {
          background: var(--electric-glow);
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .electrical-component-management {
    .analytics-grid {
      grid-template-columns: 1fr;
    }
    
    .traceability-result {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 768px) {
  .electrical-component-management {
    padding: 10px;
    
    .page-header {
      flex-direction: column;
      gap: 20px;
      text-align: center;
      
      .header-stats {
        justify-content: center;
      }
    }
    
    .search-filters .filter-row {
      flex-direction: column;
      
      .search-input,
      .filter-select {
        width: 100%;
        max-width: none;
      }
    }
    
    .component-detail .basic-info-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>

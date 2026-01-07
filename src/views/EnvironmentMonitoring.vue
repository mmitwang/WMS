<template>
  <div class="environment-monitoring">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>卷材存储环境监控</h1>
      <p>实时监控严牌滤布卷材存储环境的温湿度状况</p>
    </div>

    <!-- 实时环境概览 -->
    <div class="environment-overview">
      <el-row :gutter="20">
        <el-col :span="6" v-for="zone in storageZones" :key="zone.id">
          <el-card class="zone-card" :class="getZoneStatusClass(zone)">
            <template #header>
              <div class="zone-header">
                <span class="zone-name">{{ zone.name }}</span>
                <el-tag :type="getStatusTagType(zone.status)" size="small">
                  {{ getStatusText(zone.status) }}
                </el-tag>
              </div>
            </template>
            
            <div class="zone-data">
              <div class="data-item">
                <i class="el-icon-thermometer"></i>
                <span class="label">温度</span>
                <span class="value" :class="getTemperatureClass(zone.temperature, zone.threshold?.temperature)">
                  {{ zone.temperature }}°C
                </span>
              </div>
              
              <div class="data-item">
                <i class="el-icon-cloudy"></i>
                <span class="label">湿度</span>
                <span class="value" :class="getHumidityClass(zone.humidity, zone.threshold?.humidity)">
                  {{ zone.humidity }}%
                </span>
              </div>
              
              <div class="data-item" v-if="zone.comfort">
                <i class="el-icon-star-on"></i>
                <span class="label">舒适度</span>
                <span class="value" :class="getComfortClass(zone.comfort.level)">
                  {{ zone.comfort.index }}
                </span>
              </div>
            </div>
            
            <div class="zone-actions">
              <el-button size="small" @click="viewZoneDetails(zone)">详情</el-button>
              <el-button size="small" @click="configureThreshold(zone)">设置</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 环境趋势图表 -->
    <div class="environment-charts">
      <el-card>
        <template #header>
          <div class="chart-header">
            <span>环境趋势分析</span>
            <div class="chart-controls">
              <el-select v-model="selectedZone" placeholder="选择存储区域" size="small" style="width: 150px;">
                <el-option
                  v-for="zone in storageZones"
                  :key="zone.id"
                  :label="zone.name"
                  :value="zone.id">
                </el-option>
              </el-select>
              <el-date-picker
                v-model="dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                size="small"
                style="margin-left: 10px;"
                @change="loadHistoryData">
              </el-date-picker>
            </div>
          </div>
        </template>
        
        <div class="chart-container">
          <div ref="temperatureChart" class="chart" style="height: 300px;"></div>
          <div ref="humidityChart" class="chart" style="height: 300px;"></div>
        </div>
      </el-card>
    </div>

    <!-- 环境预警列表 -->
    <div class="environment-alerts">
      <el-card>
        <template #header>
          <div class="alerts-header">
            <span>环境预警记录</span>
            <el-button type="primary" size="small" @click="refreshAlerts">
              <i class="el-icon-refresh"></i> 刷新
            </el-button>
          </div>
        </template>
        
        <el-table :data="alerts" stripe>
          <el-table-column prop="id" label="预警ID" width="150"></el-table-column>
          <el-table-column prop="zoneName" label="存储区域" width="120"></el-table-column>
          <el-table-column label="预警等级" width="100">
            <template #default="scope">
              <el-tag :type="getAlertLevelType(scope.row.level)" size="small">
                {{ getAlertLevelText(scope.row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="预警信息" min-width="200"></el-table-column>
          <el-table-column label="环境数据" width="150">
            <template #default="scope">
              <div v-if="scope.row.data">
                <div>温度: {{ scope.row.data.temperature }}°C</div>
                <div>湿度: {{ scope.row.data.humidity }}%</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="timestamp" label="发生时间" width="160">
            <template #default="scope">
              {{ formatDateTime(scope.row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'resolved' ? 'success' : 'warning'" size="small">
                {{ scope.row.status === 'resolved' ? '已处理' : '待处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button
                v-if="scope.row.status === 'pending'"
                type="primary"
                size="small"
                @click="handleAlert(scope.row)">
                处理
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination">
          <el-pagination
            v-model:current-page="alertPagination.page"
            v-model:page-size="alertPagination.size"
            :total="alertPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadAlerts"
            @current-change="loadAlerts">
          </el-pagination>
        </div>
      </el-card>
    </div>

    <!-- 阈值配置对话框 -->
    <el-dialog
      v-model="thresholdDialogVisible"
      title="环境阈值配置"
      width="500px">
      <el-form :model="thresholdForm" :rules="thresholdRules" ref="thresholdFormRef" label-width="100px">
        <el-form-item label="存储区域">
          <el-input v-model="thresholdForm.zoneName" disabled></el-input>
        </el-form-item>
        
        <el-divider content-position="left">温度阈值 (°C)</el-divider>
        <el-form-item label="最低温度" prop="temperatureMin">
          <el-input-number
            v-model="thresholdForm.temperatureMin"
            :min="-50"
            :max="80"
            :precision="1"
            style="width: 100%;">
          </el-input-number>
        </el-form-item>
        <el-form-item label="最高温度" prop="temperatureMax">
          <el-input-number
            v-model="thresholdForm.temperatureMax"
            :min="-50"
            :max="80"
            :precision="1"
            style="width: 100%;">
          </el-input-number>
        </el-form-item>
        
        <el-divider content-position="left">湿度阈值 (%)</el-divider>
        <el-form-item label="最低湿度" prop="humidityMin">
          <el-input-number
            v-model="thresholdForm.humidityMin"
            :min="0"
            :max="100"
            :precision="1"
            style="width: 100%;">
          </el-input-number>
        </el-form-item>
        <el-form-item label="最高湿度" prop="humidityMax">
          <el-input-number
            v-model="thresholdForm.humidityMax"
            :min="0"
            :max="100"
            :precision="1"
            style="width: 100%;">
          </el-input-number>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="thresholdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveThreshold">保存</el-button>
      </template>
    </el-dialog>

    <!-- 区域详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="存储区域详情"
      width="800px">
      <div v-if="selectedZoneDetail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="区域名称">{{ selectedZoneDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="区域编码">{{ selectedZoneDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="当前温度">
            <span :class="getTemperatureClass(selectedZoneDetail.temperature, selectedZoneDetail.threshold?.temperature)">
              {{ selectedZoneDetail.temperature }}°C
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="当前湿度">
            <span :class="getHumidityClass(selectedZoneDetail.humidity, selectedZoneDetail.threshold?.humidity)">
              {{ selectedZoneDetail.humidity }}%
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="环境状态">
            <el-tag :type="getStatusTagType(selectedZoneDetail.status)">
              {{ getStatusText(selectedZoneDetail.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="舒适度指数" v-if="selectedZoneDetail.comfort">
            <span :class="getComfortClass(selectedZoneDetail.comfort.level)">
              {{ selectedZoneDetail.comfort.index }} ({{ getComfortLevelText(selectedZoneDetail.comfort.level) }})
            </span>
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">阈值配置</el-divider>
        <el-descriptions :column="2" border v-if="selectedZoneDetail.threshold">
          <el-descriptions-item label="温度范围">
            {{ selectedZoneDetail.threshold.temperature?.min }}°C ~ {{ selectedZoneDetail.threshold.temperature?.max }}°C
          </el-descriptions-item>
          <el-descriptions-item label="湿度范围">
            {{ selectedZoneDetail.threshold.humidity?.min }}% ~ {{ selectedZoneDetail.threshold.humidity?.max }}%
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">存储卷材</el-divider>
        <el-table :data="selectedZoneDetail.materials || []" size="small">
          <el-table-column prop="code" label="卷材编码" width="180"></el-table-column>
          <el-table-column prop="material" label="材质" width="100"></el-table-column>
          <el-table-column prop="width" label="宽幅" width="80"></el-table-column>
          <el-table-column prop="length" label="长度" width="80"></el-table-column>
          <el-table-column prop="storageDate" label="入库时间" width="120"></el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import environmentService from '@/services/environmentService'

export default {
  name: 'EnvironmentMonitoring',
  setup() {
    // 响应式数据
    const storageZones = ref([])
    const alerts = ref([])
    const selectedZone = ref('')
    const dateRange = ref([])
    const thresholdDialogVisible = ref(false)
    const detailDialogVisible = ref(false)
    const selectedZoneDetail = ref(null)
    
    // 分页数据
    const alertPagination = reactive({
      page: 1,
      size: 20,
      total: 0
    })
    
    // 表单数据
    const thresholdForm = reactive({
      zoneId: '',
      zoneName: '',
      temperatureMin: 15,
      temperatureMax: 25,
      humidityMin: 45,
      humidityMax: 65
    })
    
    // 表单验证规则
    const thresholdRules = {
      temperatureMin: [
        { required: true, message: '请输入最低温度', trigger: 'blur' },
        { type: 'number', message: '温度必须是数字' }
      ],
      temperatureMax: [
        { required: true, message: '请输入最高温度', trigger: 'blur' },
        { type: 'number', message: '温度必须是数字' }
      ],
      humidityMin: [
        { required: true, message: '请输入最低湿度', trigger: 'blur' },
        { type: 'number', message: '湿度必须是数字' }
      ],
      humidityMax: [
        { required: true, message: '请输入最高湿度', trigger: 'blur' },
        { type: 'number', message: '湿度必须是数字' }
      ]
    }
    
    const thresholdFormRef = ref(null)
    const temperatureChart = ref(null)
    const humidityChart = ref(null)
    
    // 图表实例
    let tempChartInstance = null
    let humidityChartInstance = null
    
    // 加载存储区域数据
    const loadStorageZones = async () => {
      try {
        const response = await environmentService.environmentAPI.getStorageZones()
        storageZones.value = response.data.map(zone => {
          // 计算舒适度指数
          if (zone.temperature !== undefined && zone.humidity !== undefined) {
            zone.comfort = environmentService.calculateComfortIndex(zone.temperature, zone.humidity)
          }
          
          // 评估环境状态
          if (zone.threshold) {
            const assessment = environmentService.assessEnvironmentStatus(zone, zone.threshold)
            zone.status = assessment.status
            zone.statusMessage = assessment.message
          } else {
            zone.status = 'unknown'
          }
          
          return zone
        })
        
        if (storageZones.value.length > 0 && !selectedZone.value) {
          selectedZone.value = storageZones.value[0].id
        }
      } catch (error) {
        console.error('加载存储区域失败:', error)
        ElMessage.error('加载存储区域数据失败')
      }
    }
    
    // 加载预警数据
    const loadAlerts = async () => {
      try {
        const params = {
          page: alertPagination.page,
          size: alertPagination.size
        }
        const response = await environmentService.environmentAPI.getAlerts(params)
        alerts.value = response.data.list
        alertPagination.total = response.data.total
      } catch (error) {
        console.error('加载预警数据失败:', error)
        ElMessage.error('加载预警数据失败')
      }
    }
    
    // 加载历史数据并更新图表
    const loadHistoryData = async () => {
      if (!selectedZone.value || !dateRange.value || dateRange.value.length !== 2) {
        return
      }
      
      try {
        const params = {
          zoneId: selectedZone.value,
          startTime: dateRange.value[0],
          endTime: dateRange.value[1]
        }
        const response = await environmentService.environmentAPI.getHistoryData(params)
        updateCharts(response.data)
      } catch (error) {
        console.error('加载历史数据失败:', error)
        ElMessage.error('加载历史数据失败')
      }
    }
    
    // 更新图表
    const updateCharts = (data) => {
      if (!data || data.length === 0) return
      
      const times = data.map(item => new Date(item.timestamp).toLocaleString())
      const temperatures = data.map(item => item.temperature)
      const humidities = data.map(item => item.humidity)
      
      // 温度图表配置
      const tempOption = {
        title: { text: '温度趋势', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: times },
        yAxis: { type: 'value', name: '温度 (°C)' },
        series: [{
          name: '温度',
          type: 'line',
          data: temperatures,
          smooth: true,
          itemStyle: { color: '#ff6b6b' }
        }]
      }
      
      // 湿度图表配置
      const humidityOption = {
        title: { text: '湿度趋势', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: times },
        yAxis: { type: 'value', name: '湿度 (%)' },
        series: [{
          name: '湿度',
          type: 'line',
          data: humidities,
          smooth: true,
          itemStyle: { color: '#4ecdc4' }
        }]
      }
      
      if (tempChartInstance) {
        tempChartInstance.setOption(tempOption)
      }
      if (humidityChartInstance) {
        humidityChartInstance.setOption(humidityOption)
      }
    }
    
    // 初始化图表
    const initCharts = () => {
      nextTick(() => {
        if (temperatureChart.value) {
          tempChartInstance = echarts.init(temperatureChart.value)
        }
        if (humidityChart.value) {
          humidityChartInstance = echarts.init(humidityChart.value)
        }
      })
    }
    
    // 查看区域详情
    const viewZoneDetails = async (zone) => {
      selectedZoneDetail.value = zone
      detailDialogVisible.value = true
    }
    
    // 配置阈值
    const configureThreshold = (zone) => {
      thresholdForm.zoneId = zone.id
      thresholdForm.zoneName = zone.name
      
      if (zone.threshold) {
        thresholdForm.temperatureMin = zone.threshold.temperature?.min || 15
        thresholdForm.temperatureMax = zone.threshold.temperature?.max || 25
        thresholdForm.humidityMin = zone.threshold.humidity?.min || 45
        thresholdForm.humidityMax = zone.threshold.humidity?.max || 65
      }
      
      thresholdDialogVisible.value = true
    }
    
    // 保存阈值配置
    const saveThreshold = async () => {
      try {
        await thresholdFormRef.value.validate()
        
        const thresholdData = {
          zoneId: thresholdForm.zoneId,
          temperature: {
            min: thresholdForm.temperatureMin,
            max: thresholdForm.temperatureMax
          },
          humidity: {
            min: thresholdForm.humidityMin,
            max: thresholdForm.humidityMax
          }
        }
        
        // 验证阈值数据
        const validation = environmentService.validateThreshold(thresholdData)
        if (!validation.isValid) {
          ElMessage.error(validation.errors.join(', '))
          return
        }
        
        await environmentService.environmentAPI.setThreshold(thresholdData)
        ElMessage.success('阈值配置保存成功')
        thresholdDialogVisible.value = false
        loadStorageZones()
      } catch (error) {
        console.error('保存阈值配置失败:', error)
        ElMessage.error('保存阈值配置失败')
      }
    }
    
    // 处理预警
    const handleAlert = async (alert) => {
      try {
        await ElMessageBox.confirm('确认处理此预警？', '确认操作', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await environmentService.environmentAPI.handleAlert(alert.id, { status: 'resolved' })
        ElMessage.success('预警处理成功')
        loadAlerts()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('处理预警失败:', error)
          ElMessage.error('处理预警失败')
        }
      }
    }
    
    // 刷新预警数据
    const refreshAlerts = () => {
      loadAlerts()
      loadStorageZones()
    }
    
    // 样式类名获取函数
    const getZoneStatusClass = (zone) => {
      return `zone-${zone.status}`
    }
    
    const getStatusTagType = (status) => {
      const typeMap = {
        normal: 'success',
        warning: 'warning',
        critical: 'danger',
        unknown: 'info'
      }
      return typeMap[status] || 'info'
    }
    
    const getStatusText = (status) => {
      const textMap = {
        normal: '正常',
        warning: '警告',
        critical: '严重',
        unknown: '未知'
      }
      return textMap[status] || '未知'
    }
    
    const getTemperatureClass = (temp, threshold) => {
      if (!threshold) return ''
      if (temp < threshold.min || temp > threshold.max) return 'abnormal'
      return 'normal'
    }
    
    const getHumidityClass = (humidity, threshold) => {
      if (!threshold) return ''
      if (humidity < threshold.min || humidity > threshold.max) return 'abnormal'
      return 'normal'
    }
    
    const getComfortClass = (level) => {
      const classMap = {
        excellent: 'comfort-excellent',
        good: 'comfort-good',
        fair: 'comfort-fair',
        poor: 'comfort-poor',
        critical: 'comfort-critical'
      }
      return classMap[level] || ''
    }
    
    const getComfortLevelText = (level) => {
      const textMap = {
        excellent: '优秀',
        good: '良好',
        fair: '一般',
        poor: '较差',
        critical: '严重'
      }
      return textMap[level] || '未知'
    }
    
    const getAlertLevelType = (level) => {
      const typeMap = {
        low: 'info',
        medium: 'warning',
        high: 'danger'
      }
      return typeMap[level] || 'info'
    }
    
    const getAlertLevelText = (level) => {
      const textMap = {
        low: '低',
        medium: '中',
        high: '高'
      }
      return textMap[level] || '未知'
    }
    
    // 格式化日期时间
    const formatDateTime = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }
    
    // 组件挂载
    onMounted(() => {
      loadStorageZones()
      loadAlerts()
      initCharts()
      
      // 设置默认时间范围（最近24小时）
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      dateRange.value = [yesterday, now]
    })
    
    return {
      // 数据
      storageZones,
      alerts,
      selectedZone,
      dateRange,
      thresholdDialogVisible,
      detailDialogVisible,
      selectedZoneDetail,
      alertPagination,
      thresholdForm,
      thresholdRules,
      thresholdFormRef,
      temperatureChart,
      humidityChart,
      
      // 方法
      loadHistoryData,
      viewZoneDetails,
      configureThreshold,
      saveThreshold,
      handleAlert,
      refreshAlerts,
      getZoneStatusClass,
      getStatusTagType,
      getStatusText,
      getTemperatureClass,
      getHumidityClass,
      getComfortClass,
      getComfortLevelText,
      getAlertLevelType,
      getAlertLevelText,
      formatDateTime,
      loadAlerts
    }
  }
}
</script>

<style scoped>
.environment-monitoring {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.environment-overview {
  margin-bottom: 20px;
}

.zone-card {
  transition: all 0.3s ease;
}

.zone-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.zone-card.zone-normal {
  border-left: 4px solid #67c23a;
}

.zone-card.zone-warning {
  border-left: 4px solid #e6a23c;
}

.zone-card.zone-critical {
  border-left: 4px solid #f56c6c;
}

.zone-card.zone-unknown {
  border-left: 4px solid #909399;
}

.zone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.zone-name {
  font-weight: bold;
  color: #303133;
}

.zone-data {
  margin: 15px 0;
}

.data-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.data-item i {
  margin-right: 8px;
  color: #909399;
}

.data-item .label {
  flex: 1;
  color: #606266;
  font-size: 14px;
}

.data-item .value {
  font-weight: bold;
  font-size: 16px;
}

.data-item .value.normal {
  color: #67c23a;
}

.data-item .value.abnormal {
  color: #f56c6c;
}

.data-item .value.comfort-excellent {
  color: #67c23a;
}

.data-item .value.comfort-good {
  color: #95d475;
}

.data-item .value.comfort-fair {
  color: #e6a23c;
}

.data-item .value.comfort-poor {
  color: #f78989;
}

.data-item .value.comfort-critical {
  color: #f56c6c;
}

.zone-actions {
  display: flex;
  gap: 8px;
}

.environment-charts {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-controls {
  display: flex;
  align-items: center;
}

.chart-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.environment-alerts {
  margin-bottom: 20px;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

@media (max-width: 768px) {
  .chart-container {
    grid-template-columns: 1fr;
  }
  
  .chart-controls {
    flex-direction: column;
    gap: 10px;
  }
}
</style>

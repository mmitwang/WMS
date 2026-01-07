import request from '@/utils/request'

/**
 * 卷材存储环境监控服务
 * 专门针对严牌滤布卷材的存储环境管理
 */

// 环境监控API接口
export const environmentAPI = {
  // 获取环境监控数据
  getEnvironmentData: (params) => request.get('/api/environment/data', { params }),
  
  // 获取实时环境数据
  getRealTimeData: (zoneId) => request.get(`/api/environment/realtime/${zoneId}`),
  
  // 获取环境历史数据
  getHistoryData: (params) => request.get('/api/environment/history', { params }),
  
  // 设置环境阈值
  setThreshold: (data) => request.post('/api/environment/threshold', data),
  
  // 获取环境阈值配置
  getThreshold: (zoneId) => request.get(`/api/environment/threshold/${zoneId}`),
  
  // 获取环境预警记录
  getAlerts: (params) => request.get('/api/environment/alerts', { params }),
  
  // 处理环境预警
  handleAlert: (alertId, data) => request.put(`/api/environment/alerts/${alertId}`, data),
  
  // 获取存储区域配置
  getStorageZones: () => request.get('/api/environment/zones'),
  
  // 更新存储区域配置
  updateStorageZone: (zoneId, data) => request.put(`/api/environment/zones/${zoneId}`, data)
}

/**
 * 环境数据验证
 */
export function validateEnvironmentData(data) {
  const errors = []
  
  if (!data) {
    errors.push('环境数据不能为空')
    return { isValid: false, errors }
  }
  
  // 温度验证 (滤布卷材适宜温度: 15-25°C)
  if (data.temperature !== undefined) {
    if (typeof data.temperature !== 'number') {
      errors.push('温度必须是数字类型')
    } else if (data.temperature < -50 || data.temperature > 80) {
      errors.push('温度值超出合理范围(-50°C ~ 80°C)')
    }
  }
  
  // 湿度验证 (滤布卷材适宜湿度: 45-65%RH)
  if (data.humidity !== undefined) {
    if (typeof data.humidity !== 'number') {
      errors.push('湿度必须是数字类型')
    } else if (data.humidity < 0 || data.humidity > 100) {
      errors.push('湿度值必须在0-100%之间')
    }
  }
  
  // 存储区域验证
  if (data.zoneId && typeof data.zoneId !== 'string') {
    errors.push('存储区域ID必须是字符串类型')
  }
  
  // 时间戳验证
  if (data.timestamp && !isValidTimestamp(data.timestamp)) {
    errors.push('时间戳格式无效')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 环境阈值验证
 */
export function validateThreshold(threshold) {
  const errors = []
  
  if (!threshold) {
    errors.push('阈值配置不能为空')
    return { isValid: false, errors }
  }
  
  // 温度阈值验证
  if (threshold.temperature) {
    const { min, max } = threshold.temperature
    if (typeof min !== 'number' || typeof max !== 'number') {
      errors.push('温度阈值必须是数字类型')
    } else if (min >= max) {
      errors.push('温度最小值必须小于最大值')
    } else if (min < -50 || max > 80) {
      errors.push('温度阈值超出合理范围')
    }
  }
  
  // 湿度阈值验证
  if (threshold.humidity) {
    const { min, max } = threshold.humidity
    if (typeof min !== 'number' || typeof max !== 'number') {
      errors.push('湿度阈值必须是数字类型')
    } else if (min >= max) {
      errors.push('湿度最小值必须小于最大值')
    } else if (min < 0 || max > 100) {
      errors.push('湿度阈值必须在0-100%之间')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 环境状态评估
 */
export function assessEnvironmentStatus(data, threshold) {
  if (!data || !threshold) {
    return { status: 'unknown', message: '数据不完整' }
  }
  
  const issues = []
  
  // 温度状态检查
  if (data.temperature !== undefined && threshold.temperature) {
    const { min, max } = threshold.temperature
    if (data.temperature < min) {
      issues.push(`温度过低(${data.temperature}°C < ${min}°C)`)
    } else if (data.temperature > max) {
      issues.push(`温度过高(${data.temperature}°C > ${max}°C)`)
    }
  }
  
  // 湿度状态检查
  if (data.humidity !== undefined && threshold.humidity) {
    const { min, max } = threshold.humidity
    if (data.humidity < min) {
      issues.push(`湿度过低(${data.humidity}% < ${min}%)`)
    } else if (data.humidity > max) {
      issues.push(`湿度过高(${data.humidity}% > ${max}%)`)
    }
  }
  
  if (issues.length === 0) {
    return { status: 'normal', message: '环境正常' }
  } else if (issues.length === 1) {
    return { status: 'warning', message: issues[0] }
  } else {
    return { status: 'critical', message: `多项异常: ${issues.join(', ')}` }
  }
}

/**
 * 生成环境预警
 */
export function generateEnvironmentAlert(data, threshold, zoneInfo) {
  const assessment = assessEnvironmentStatus(data, threshold)
  
  if (assessment.status === 'normal') {
    return null
  }
  
  const alertLevel = assessment.status === 'warning' ? 'medium' : 'high'
  
  return {
    id: generateAlertId(),
    zoneId: data.zoneId,
    zoneName: zoneInfo?.name || '未知区域',
    level: alertLevel,
    type: 'environment',
    message: assessment.message,
    data: {
      temperature: data.temperature,
      humidity: data.humidity,
      threshold
    },
    timestamp: new Date().toISOString(),
    status: 'pending'
  }
}

/**
 * 计算环境舒适度指数
 * 基于温湿度综合评估滤布存储环境质量
 */
export function calculateComfortIndex(temperature, humidity) {
  if (typeof temperature !== 'number' || typeof humidity !== 'number') {
    return null
  }
  
  // 滤布卷材最适宜条件: 温度20°C, 湿度55%
  const optimalTemp = 20
  const optimalHumidity = 55
  
  // 温度偏差计算 (权重0.6)
  const tempDeviation = Math.abs(temperature - optimalTemp) / 10
  const tempScore = Math.max(0, 1 - tempDeviation) * 0.6
  
  // 湿度偏差计算 (权重0.4)
  const humidityDeviation = Math.abs(humidity - optimalHumidity) / 20
  const humidityScore = Math.max(0, 1 - humidityDeviation) * 0.4
  
  // 综合舒适度指数 (0-100)
  const comfortIndex = Math.round((tempScore + humidityScore) * 100)
  
  return {
    index: comfortIndex,
    level: getComfortLevel(comfortIndex),
    temperature: {
      value: temperature,
      optimal: optimalTemp,
      deviation: Math.round(Math.abs(temperature - optimalTemp) * 10) / 10
    },
    humidity: {
      value: humidity,
      optimal: optimalHumidity,
      deviation: Math.round(Math.abs(humidity - optimalHumidity) * 10) / 10
    }
  }
}

/**
 * 获取舒适度等级
 */
function getComfortLevel(index) {
  if (index >= 90) return 'excellent'
  if (index >= 80) return 'good'
  if (index >= 70) return 'fair'
  if (index >= 60) return 'poor'
  return 'critical'
}

/**
 * 环境数据统计分析
 */
export function analyzeEnvironmentData(dataList) {
  if (!Array.isArray(dataList) || dataList.length === 0) {
    return null
  }
  
  const temperatures = dataList.map(d => d.temperature).filter(t => typeof t === 'number')
  const humidities = dataList.map(d => d.humidity).filter(h => typeof h === 'number')
  
  const analysis = {
    period: {
      start: dataList[0]?.timestamp,
      end: dataList[dataList.length - 1]?.timestamp,
      count: dataList.length
    },
    temperature: temperatures.length > 0 ? {
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      avg: Math.round(temperatures.reduce((a, b) => a + b, 0) / temperatures.length * 10) / 10,
      current: temperatures[temperatures.length - 1]
    } : null,
    humidity: humidities.length > 0 ? {
      min: Math.min(...humidities),
      max: Math.max(...humidities),
      avg: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length * 10) / 10,
      current: humidities[humidities.length - 1]
    } : null
  }
  
  // 计算当前舒适度
  if (analysis.temperature && analysis.humidity) {
    analysis.comfort = calculateComfortIndex(
      analysis.temperature.current,
      analysis.humidity.current
    )
  }
  
  return analysis
}

// 辅助函数
function isValidTimestamp(timestamp) {
  const date = new Date(timestamp)
  return date instanceof Date && !isNaN(date.getTime())
}

function generateAlertId() {
  return 'ENV-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase()
}

// 默认导出
export default {
  environmentAPI,
  validateEnvironmentData,
  validateThreshold,
  assessEnvironmentStatus,
  generateEnvironmentAlert,
  calculateComfortIndex,
  analyzeEnvironmentData
}

/**
 * 严牌滤布卷材管理服务
 * 实现卷材录入、库位分配、入库等核心功能
 */

import { request } from '../utils/request'

// 模拟数据存储（实际项目中应该连接后端API）
let mockData = {
  cloths: [
    {
      id: 1,
      code: 'YP-DL-3000-20260107-B001',
      material: 'DL',
      width: 3000,
      length: 100.5,
      weight: 280.5,
      productionDate: '2026-01-07',
      batchNo: 'B001',
      supplier: '江苏严牌环保科技有限公司',
      quantity: 1,
      status: 'pending',
      locationCode: '',
      createTime: '2026-01-07 09:00:00',
      updateTime: '2026-01-07 09:00:00'
    },
    {
      id: 2,
      code: 'YP-PPS-1500-20260106-A002',
      material: 'PPS',
      width: 1500,
      length: 80.0,
      weight: 150.0,
      productionDate: '2026-01-06',
      batchNo: 'A002',
      supplier: '上海滤材供应商',
      quantity: 2,
      status: 'stored',
      locationCode: 'CW01-CP-03-02',
      createTime: '2026-01-06 14:30:00',
      updateTime: '2026-01-07 10:15:00'
    }
  ],
  locations: [
    {
      code: 'CW01-CP-05-01',
      name: '重型货架1层',
      capacity: '500kg',
      maxWidth: 6000,
      currentWeight: 0,
      maxWeight: 500,
      usage: 0,
      type: 'heavy'
    },
    {
      code: 'CW01-CP-05-02',
      name: '重型货架2层',
      capacity: '500kg',
      maxWidth: 6000,
      currentWeight: 280.5,
      maxWeight: 500,
      usage: 56,
      type: 'heavy'
    },
    {
      code: 'CW01-CP-03-01',
      name: '中型货架1层',
      capacity: '300kg',
      maxWidth: 3000,
      currentWeight: 0,
      maxWeight: 300,
      usage: 0,
      type: 'medium'
    },
    {
      code: 'CW01-CP-03-02',
      name: '中型货架2层',
      capacity: '300kg',
      maxWidth: 3000,
      currentWeight: 150,
      maxWeight: 300,
      usage: 50,
      type: 'medium'
    }
  ]
}

let nextId = 3

/**
 * 生成卷材编码
 * 规则：YP+材质编码+宽幅+生产日期+批次号
 */
const generateClothCode = (material, width, productionDate, batchNo) => {
  const dateStr = new Date(productionDate).toISOString().slice(0, 10).replace(/-/g, '')
  return `YP-${material}-${width}-${dateStr}-${batchNo}`
}

/**
 * 验证卷材编码唯一性
 */
const validateClothCode = (code, excludeId = null) => {
  return !mockData.cloths.some(cloth => cloth.code === code && cloth.id !== excludeId)
}

/**
 * 验证卷材参数
 */
const validateClothParams = (data) => {
  const errors = []
  
  // 宽幅验证
  if (!data.width || data.width < 500) {
    errors.push('宽幅不能小于500mm')
  }
  
  // 长度验证
  if (!data.length || data.length < 10) {
    errors.push('长度不能小于10m')
  }
  
  // 重量验证
  if (!data.weight || data.weight < 50 || data.weight > 500) {
    errors.push('重量必须在50-500kg范围内')
  }
  
  return errors
}

/**
 * 智能库位分配算法
 */
const getRecommendedLocation = (width, weight, material) => {
  // 过滤可用库位
  const availableLocations = mockData.locations.filter(location => {
    // 宽幅适配检查
    if (width > location.maxWidth) return false
    
    // 重量检查
    if (weight > 300 && location.type !== 'heavy') return false
    if (location.currentWeight + weight > location.maxWeight) return false
    
    return true
  })
  
  if (availableLocations.length === 0) {
    throw new Error('没有合适的库位可分配')
  }
  
  // 排序逻辑：
  // 1. 重量>300kg优先分配重型货架
  // 2. 优先分配使用率较低的库位
  // 3. 同类型货架优先分配相邻库位
  availableLocations.sort((a, b) => {
    // 重型货架优先级
    if (weight > 300) {
      if (a.type === 'heavy' && b.type !== 'heavy') return -1
      if (a.type !== 'heavy' && b.type === 'heavy') return 1
    }
    
    // 使用率排序
    return a.usage - b.usage
  })
  
  const recommended = availableLocations[0]
  
  // 生成推荐说明
  let reason = ''
  if (weight > 300) {
    reason = `重量${weight}kg超过300kg，分配至承重${recommended.capacity}的重型货架`
  } else if (width > 3000) {
    reason = `宽幅${width}mm较大，分配至适配宽幅的专用货架`
  } else {
    reason = `根据宽幅${width}mm和重量${weight}kg，智能匹配最优库位`
  }
  
  return {
    code: recommended.code,
    description: recommended.name,
    reason: reason,
    capacity: recommended.capacity,
    usage: Math.round((recommended.currentWeight + weight) / recommended.maxWeight * 100)
  }
}

/**
 * 更新库位使用情况
 */
const updateLocationUsage = (locationCode, weight, operation = 'add') => {
  const location = mockData.locations.find(loc => loc.code === locationCode)
  if (location) {
    if (operation === 'add') {
      location.currentWeight += weight
    } else {
      location.currentWeight = Math.max(0, location.currentWeight - weight)
    }
    location.usage = Math.round(location.currentWeight / location.maxWeight * 100)
  }
}

/**
 * 模拟ERP同步
 */
const syncToERP = async (inboundData) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 模拟10%的失败率
  if (Math.random() < 0.1) {
    throw new Error('ERP系统连接超时')
  }
  
  console.log('ERP同步成功:', inboundData)
  return { success: true, syncTime: new Date().toISOString() }
}

/**
 * ERP同步重试机制
 */
const syncToERPWithRetry = async (inboundData, maxRetries = 3) => {
  let lastError = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await syncToERP(inboundData)
    } catch (error) {
      lastError = error
      console.warn(`ERP同步失败，第${i + 1}次重试:`, error.message)
      
      if (i < maxRetries - 1) {
        // 等待递增时间后重试
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 2000))
      }
    }
  }
  
  // 所有重试都失败，记录异常并推送给管理员
  console.error('ERP同步最终失败:', lastError.message)
  // 这里应该推送通知给管理员
  throw new Error(`ERP同步失败，已重试${maxRetries}次: ${lastError.message}`)
}

export const filterClothService = {
  /**
   * 获取卷材列表
   */
  async getList(params = {}) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    let filteredData = [...mockData.cloths]
    
    // 筛选逻辑
    if (params.code) {
      filteredData = filteredData.filter(item => 
        item.code.toLowerCase().includes(params.code.toLowerCase())
      )
    }
    
    if (params.material) {
      filteredData = filteredData.filter(item => item.material === params.material)
    }
    
    if (params.status) {
      filteredData = filteredData.filter(item => item.status === params.status)
    }
    
    // 分页
    const page = params.page || 1
    const size = params.size || 20
    const start = (page - 1) * size
    const end = start + size
    
    return {
      data: filteredData.slice(start, end),
      total: filteredData.length,
      page,
      size
    }
  },

  /**
   * 创建卷材记录
   */
  async create(data) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 参数验证
    const validationErrors = validateClothParams(data)
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('; '))
    }
    
    // 生成编码
    const code = data.code || generateClothCode(
      data.material, 
      data.width, 
      data.productionDate, 
      data.batchNo
    )
    
    // 编码唯一性验证
    if (!validateClothCode(code)) {
      throw new Error('编码已存在')
    }
    
    // 创建记录
    const newCloth = {
      id: nextId++,
      ...data,
      code,
      status: 'pending',
      locationCode: '',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    mockData.cloths.push(newCloth)
    
    return {
      success: true,
      data: newCloth,
      message: '录入成功'
    }
  },

  /**
   * 获取推荐库位
   */
  async getRecommendedLocation(params) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 200))
    
    try {
      const recommendation = getRecommendedLocation(
        params.width,
        params.weight,
        params.material
      )
      
      return recommendation
    } catch (error) {
      throw new Error(error.message)
    }
  },

  /**
   * 分配库位
   */
  async assignLocation(params) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const cloth = mockData.cloths.find(item => item.id === params.clothId)
    if (!cloth) {
      throw new Error('卷材记录不存在')
    }
    
    // 验证库位是否可用
    const location = mockData.locations.find(loc => loc.code === params.locationCode)
    if (!location) {
      throw new Error('库位不存在')
    }
    
    if (location.currentWeight + cloth.weight > location.maxWeight) {
      throw new Error('库位容量不足')
    }
    
    // 更新卷材库位
    cloth.locationCode = params.locationCode
    cloth.updateTime = new Date().toISOString()
    
    return {
      success: true,
      message: '库位分配成功'
    }
  },

  /**
   * 卷材入库
   */
  async inbound(clothIds) {
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const inboundCloths = []
    const errors = []
    
    for (const id of clothIds) {
      const cloth = mockData.cloths.find(item => item.id === id)
      if (!cloth) {
        errors.push(`卷材ID ${id} 不存在`)
        continue
      }
      
      if (cloth.status !== 'pending') {
        errors.push(`卷材 ${cloth.code} 状态不正确`)
        continue
      }
      
      if (!cloth.locationCode) {
        errors.push(`卷材 ${cloth.code} 未分配库位`)
        continue
      }
      
      inboundCloths.push(cloth)
    }
    
    if (errors.length > 0) {
      throw new Error(errors.join('; '))
    }
    
    // 生成入库单
    const inboundOrder = {
      orderNo: `IN${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-4)}`,
      inboundTime: new Date().toISOString(),
      operator: '系统管理员', // 实际应该从用户上下文获取
      cloths: inboundCloths.map(cloth => ({
        id: cloth.id,
        code: cloth.code,
        quantity: cloth.quantity,
        locationCode: cloth.locationCode
      })),
      status: 'completed'
    }
    
    try {
      // ERP同步
      await syncToERPWithRetry({
        inboundOrderNo: inboundOrder.orderNo,
        cloths: inboundOrder.cloths,
        inboundTime: inboundOrder.inboundTime
      })
      
      // 更新卷材状态和库位使用情况
      inboundCloths.forEach(cloth => {
        cloth.status = 'stored'
        cloth.updateTime = new Date().toISOString()
        updateLocationUsage(cloth.locationCode, cloth.weight, 'add')
      })
      
      return {
        success: true,
        data: inboundOrder,
        message: '入库成功'
      }
      
    } catch (error) {
      // ERP同步失败，但本地状态不回滚（根据业务需求决定）
      console.error('ERP同步失败，但入库操作已完成:', error.message)
      
      // 仍然更新本地状态
      inboundCloths.forEach(cloth => {
        cloth.status = 'stored'
        cloth.updateTime = new Date().toISOString()
        updateLocationUsage(cloth.locationCode, cloth.weight, 'add')
      })
      
      return {
        success: true,
        data: inboundOrder,
        message: '入库成功，但ERP同步失败，请联系管理员',
        warning: error.message
      }
    }
  },

  /**
   * 获取库位列表
   */
  async getLocations() {
    await new Promise(resolve => setTimeout(resolve, 200))
    return {
      success: true,
      data: mockData.locations
    }
  },

  /**
   * 获取卷材详情
   */
  async getDetail(id) {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const cloth = mockData.cloths.find(item => item.id === id)
    if (!cloth) {
      throw new Error('卷材记录不存在')
    }
    
    return {
      success: true,
      data: cloth
    }
  }
}

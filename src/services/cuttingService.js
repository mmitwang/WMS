/**
 * 卷材裁剪与余料管理服务
 * 实现领用、裁剪、余料入库等核心功能
 */

import { request } from '../utils/request'

// 模拟数据存储
let mockData = {
  records: [
    {
      id: 1,
      type: 'requisition',
      requisitionNo: 'REQ202601070001',
      clothId: 1,
      clothCode: 'YP-DL-3000-20260107-B001',
      operator: '张三',
      department: '生产部',
      length: 50.0,
      requisitionLength: 50.0,
      productionOrder: 'PO202601070001',
      operateTime: '2026-01-07 09:00:00',
      status: '已领用',
      reason: '生产订单需要'
    },
    {
      id: 2,
      type: 'cutting',
      requisitionId: 1,
      clothCode: 'YP-DL-3000-20260107-B001',
      operator: '李四',
      department: '生产部',
      length: 45.0,
      actualCuttingLength: 45.0,
      remnantLength: 5.0,
      productionOrder: 'PO202601070001',
      operateTime: '2026-01-07 10:30:00',
      status: '已裁剪',
      cuttingOperator: '李四',
      cuttingRemark: '正常裁剪'
    }
  ],
  cloths: [
    {
      id: 1,
      code: 'YP-DL-3000-20260107-B001',
      material: 'DL',
      width: 3000,
      length: 50.5, // 剩余长度
      originalLength: 100.5,
      weight: 280.5,
      status: 'stored',
      locationCode: 'CW01-CP-05-01'
    },
    {
      id: 2,
      code: 'YP-PPS-1500-20260106-A002',
      material: 'PPS',
      width: 1500,
      length: 80.0,
      originalLength: 80.0,
      weight: 150.0,
      status: 'stored',
      locationCode: 'CW01-CP-03-02'
    }
  ],
  remnants: [
    {
      id: 1,
      originalClothId: 1,
      originalClothCode: 'YP-DL-3000-20260107-B001',
      remnantCode: 'YP-DL-3000-20260107-B001-Y01',
      length: 5.0,
      material: 'DL',
      width: 3000,
      weight: 28.0,
      status: 'pending',
      createTime: '2026-01-07 10:30:00'
    }
  ]
}

let nextId = 3
let nextRequisitionNo = 2

/**
 * 生成领用单号
 */
const generateRequisitionNo = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const seqStr = String(nextRequisitionNo++).padStart(4, '0')
  return `REQ${dateStr}${seqStr}`
}

/**
 * 生成余料编码（内部函数）
 */
const generateRemnantCodeInternal = (originalCode) => {
  // 查找已有余料数量
  const existingRemnants = mockData.remnants.filter(r => 
    r.originalClothCode === originalCode
  )
  const nextSeq = existingRemnants.length + 1
  return `${originalCode}-Y${String(nextSeq).padStart(2, '0')}`
}

/**
 * 验证领用权限
 */
const validateRequisitionPermission = (department, operator) => {
  // 仅生产部人员可领用
  const allowedDepartments = ['生产部', '质检部', '研发部']
  if (!allowedDepartments.includes(department)) {
    throw new Error('该部门无领用权限，仅生产部、质检部、研发部人员可领用')
  }
  return true
}

/**
 * 验证领用长度
 */
const validateRequisitionLength = (clothId, requisitionLength) => {
  const cloth = mockData.cloths.find(c => c.id === clothId)
  if (!cloth) {
    throw new Error('卷材不存在')
  }
  
  if (requisitionLength > cloth.length) {
    throw new Error(`领用长度超过库存，当前剩余长度：${cloth.length}m`)
  }
  
  return true
}

/**
 * 验证裁剪数据（内部函数）
 */
const validateCuttingDataInternal = (requisitionLength, actualCuttingLength, remnantLength) => {
  const totalLength = actualCuttingLength + remnantLength
  const allowedDifference = 0.5 // 允许0.5m损耗
  
  if (Math.abs(totalLength - requisitionLength) > allowedDifference) {
    throw new Error(`实际裁剪长度+余料长度与领用长度差异超过${allowedDifference}m，请检查数据`)
  }
  
  return true
}

/**
 * 更新卷材剩余长度
 */
const updateClothLength = (clothId, usedLength) => {
  const cloth = mockData.cloths.find(c => c.id === clothId)
  if (cloth) {
    cloth.length = Math.max(0, cloth.length - usedLength)
  }
}

/**
 * 创建追溯记录
 */
const createTraceRecord = (type, data) => {
  const record = {
    id: Date.now(),
    type,
    operateTime: new Date().toISOString(),
    operator: data.operator,
    lengthChange: data.lengthChange || '',
    locationChange: data.locationChange || '',
    remark: data.remark || ''
  }
  
  // 这里应该保存到追溯记录表
  console.log('创建追溯记录:', record)
  return record
}

// 单独导出的函数（用于测试）
export const requestClothRoll = async (data) => {
  try {
    const response = await request.post('/api/cutting/request', data)
    return response.data
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || '网络连接失败'
    }
  }
}

export const recordCutting = async (data) => {
  try {
    const response = await request.post('/api/cutting/record', data)
    return response.data
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || '网络连接失败'
    }
  }
}

export const addRemnantToInventory = async (data) => {
  try {
    const response = await request.post('/api/cutting/remnant', data)
    return response.data
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || '网络连接失败'
    }
  }
}

export const getRemnantTraceability = async (remnantCode) => {
  try {
    const response = await request.get(`/api/cutting/remnant/trace/${remnantCode}`)
    return response.data
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || '网络连接失败'
    }
  }
}

export const getCuttingStatistics = async (params) => {
  try {
    const response = await request.get('/api/cutting/statistics', { params })
    return response.data
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message || '网络连接失败'
    }
  }
}

export const validateCuttingData = (data) => {
  const errors = []
  
  // 验证必填字段
  if (!data.requestId) errors.push('请求ID不能为空')
  if (!data.rollCode) errors.push('卷材编码不能为空')
  if (!data.actualLength) errors.push('实际长度不能为空')
  if (!data.operator) errors.push('操作员不能为空')
  
  // 验证数据格式
  if (data.actualLength && data.actualLength <= 0) {
    errors.push('实际长度必须大于0')
  }
  
  if (data.wastage && data.wastage > 20) {
    errors.push('损耗率过高')
  }
  
  // 验证编码格式
  if (data.rollCode && !data.rollCode.match(/^YP-[A-Z]+-\d+\.\d+-\d{8}-\d{3}$/)) {
    errors.push('卷材编码格式不正确')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const generateRemnantCode = (originalCode, sequence) => {
  return `${originalCode}-Y${sequence}`
}

export const calculateUtilizationRate = (actualLength, requestLength) => {
  if (requestLength === 0) return 0
  return Math.round((actualLength / requestLength) * 100)
}

export const cuttingService = {
  /**
   * 获取操作记录列表
   */
  async getRecords(params = {}) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    let filteredData = [...mockData.records]
    
    // 筛选逻辑
    if (params.type) {
      filteredData = filteredData.filter(item => item.type === params.type)
    }
    
    if (params.clothCode) {
      filteredData = filteredData.filter(item => 
        item.clothCode.toLowerCase().includes(params.clothCode.toLowerCase())
      )
    }
    
    if (params.productionOrder) {
      filteredData = filteredData.filter(item => 
        item.productionOrder && item.productionOrder.toLowerCase().includes(params.productionOrder.toLowerCase())
      )
    }
    
    if (params.operator) {
      filteredData = filteredData.filter(item => 
        item.operator.toLowerCase().includes(params.operator.toLowerCase())
      )
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
   * 获取可用卷材列表
   */
  async getAvailableCloths() {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 只返回已入库且有剩余长度的卷材
    const availableCloths = mockData.cloths.filter(cloth => 
      cloth.status === 'stored' && cloth.length > 0
    )
    
    return {
      success: true,
      data: availableCloths
    }
  },

  /**
   * 获取待裁剪的领用单
   */
  async getPendingRequisitions() {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // 返回已领用但未裁剪的记录
    const pendingRequisitions = mockData.records.filter(record => 
      record.type === 'requisition' && record.status === '已领用'
    )
    
    return {
      success: true,
      data: pendingRequisitions
    }
  },

  /**
   * 创建领用记录
   */
  async createRequisition(data) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      // 验证权限
      validateRequisitionPermission(data.department, data.operator)
      
      // 验证领用长度
      validateRequisitionLength(data.clothId, data.requisitionLength)
      
      // 获取卷材信息
      const cloth = mockData.cloths.find(c => c.id === data.clothId)
      
      // 创建领用记录
      const requisition = {
        id: nextId++,
        type: 'requisition',
        requisitionNo: generateRequisitionNo(),
        clothId: data.clothId,
        clothCode: cloth.code,
        operator: data.operator,
        department: data.department,
        length: data.requisitionLength,
        requisitionLength: data.requisitionLength,
        productionOrder: data.productionOrder,
        operateTime: new Date().toISOString(),
        status: '已领用',
        reason: data.reason
      }
      
      mockData.records.push(requisition)
      
      // 更新卷材剩余长度
      updateClothLength(data.clothId, data.requisitionLength)
      
      // 创建追溯记录
      createTraceRecord('requisition', {
        operator: data.operator,
        lengthChange: `-${data.requisitionLength}m`,
        locationChange: `${cloth.locationCode} → 生产线`,
        remark: `领用单号：${requisition.requisitionNo}`
      })
      
      return {
        success: true,
        data: requisition,
        message: '领用成功'
      }
      
    } catch (error) {
      throw new Error(error.message)
    }
  },

  /**
   * 创建裁剪记录
   */
  async createCutting(data) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    try {
      // 获取领用记录
      const requisition = mockData.records.find(r => r.id === data.requisitionId)
      if (!requisition) {
        throw new Error('领用记录不存在')
      }
      
      if (requisition.status !== '已领用') {
        throw new Error('该领用单状态不正确')
      }
      
      // 验证裁剪数据
      validateCuttingData(
        requisition.requisitionLength,
        data.actualCuttingLength,
        data.remnantLength
      )
      
      // 创建裁剪记录
      const cutting = {
        id: nextId++,
        type: 'cutting',
        requisitionId: data.requisitionId,
        clothCode: requisition.clothCode,
        operator: data.cuttingOperator,
        department: requisition.department,
        length: data.actualCuttingLength,
        actualCuttingLength: data.actualCuttingLength,
        remnantLength: data.remnantLength,
        productionOrder: requisition.productionOrder,
        operateTime: new Date().toISOString(),
        status: '已裁剪',
        cuttingOperator: data.cuttingOperator,
        cuttingRemark: data.cuttingRemark
      }
      
      mockData.records.push(cutting)
      
      // 更新领用记录状态
      requisition.status = '已裁剪'
      
      // 如果有余料，创建余料记录
      if (data.remnantLength > 0) {
        const remnant = {
          id: nextId++,
          originalClothId: requisition.clothId,
          originalClothCode: requisition.clothCode,
          remnantCode: generateRemnantCode(requisition.clothCode),
          length: data.remnantLength,
          material: mockData.cloths.find(c => c.id === requisition.clothId)?.material || 'DL',
          width: mockData.cloths.find(c => c.id === requisition.clothId)?.width || 3000,
          weight: (data.remnantLength / 100) * 280, // 估算重量
          status: 'pending',
          createTime: new Date().toISOString()
        }
        
        mockData.remnants.push(remnant)
        
        // 创建余料记录
        const remnantRecord = {
          id: nextId++,
          type: 'remnant',
          clothCode: remnant.remnantCode,
          operator: data.cuttingOperator,
          department: requisition.department,
          length: data.remnantLength,
          productionOrder: requisition.productionOrder,
          operateTime: new Date().toISOString(),
          status: '待入库',
          remnantLength: data.remnantLength
        }
        
        mockData.records.push(remnantRecord)
      }
      
      // 创建追溯记录
      createTraceRecord('cutting', {
        operator: data.cuttingOperator,
        lengthChange: `裁剪${data.actualCuttingLength}m，余料${data.remnantLength}m`,
        locationChange: '生产线',
        remark: data.cuttingRemark
      })
      
      return {
        success: true,
        data: cutting,
        message: '裁剪记录成功'
      }
      
    } catch (error) {
      throw new Error(error.message)
    }
  },

  /**
   * 余料入库
   */
  async remnantInbound(cuttingId) {
    await new Promise(resolve => setTimeout(resolve, 400))
    
    try {
      const cutting = mockData.records.find(r => r.id === cuttingId && r.type === 'cutting')
      if (!cutting) {
        throw new Error('裁剪记录不存在')
      }
      
      if (cutting.remnantLength <= 0) {
        throw new Error('该记录无余料')
      }
      
      // 查找对应的余料记录
      const remnantRecord = mockData.records.find(r => 
        r.type === 'remnant' && 
        r.productionOrder === cutting.productionOrder &&
        r.length === cutting.remnantLength &&
        r.status === '待入库'
      )
      
      if (!remnantRecord) {
        throw new Error('余料记录不存在')
      }
      
      // 分配库位（简化逻辑，实际应调用库位分配算法）
      const locationCode = 'CW01-CP-02-01' // 余料专用库位
      
      // 创建新的卷材记录（余料作为新卷材）
      const remnantCloth = {
        id: nextId++,
        code: remnantRecord.clothCode,
        material: mockData.cloths.find(c => c.code === cutting.clothCode.split('-Y')[0])?.material || 'DL',
        width: mockData.cloths.find(c => c.code === cutting.clothCode.split('-Y')[0])?.width || 3000,
        length: cutting.remnantLength,
        originalLength: cutting.remnantLength,
        weight: (cutting.remnantLength / 100) * 280,
        status: 'stored',
        locationCode: locationCode,
        isRemnant: true, // 标记为余料
        priority: 1 // 余料优先出库
      }
      
      mockData.cloths.push(remnantCloth)
      
      // 更新余料记录状态
      remnantRecord.status = '已入库'
      remnantRecord.locationCode = locationCode
      
      // 创建追溯记录
      createTraceRecord('remnant', {
        operator: '系统',
        lengthChange: `余料入库${cutting.remnantLength}m`,
        locationChange: `生产线 → ${locationCode}`,
        remark: `余料编码：${remnantRecord.clothCode}`
      })
      
      return {
        success: true,
        message: '余料入库成功',
        data: {
          remnantCode: remnantRecord.clothCode,
          locationCode: locationCode,
          length: cutting.remnantLength
        }
      }
      
    } catch (error) {
      throw new Error(error.message)
    }
  },

  /**
   * 获取追溯记录
   */
  async getTraceRecords(query) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    try {
      const traceRecords = []
      
      // 根据查询条件查找相关记录
      const relatedRecords = mockData.records.filter(record => {
        return record.clothCode.includes(query) || 
               (record.productionOrder && record.productionOrder.includes(query)) ||
               (record.requisitionNo && record.requisitionNo.includes(query))
      })
      
      // 构建追溯时间线
      relatedRecords.forEach(record => {
        let lengthChange = ''
        let locationChange = ''
        
        switch (record.type) {
          case 'requisition':
            lengthChange = `-${record.requisitionLength}m (领用)`
            locationChange = '仓库 → 生产线'
            break
          case 'cutting':
            lengthChange = `裁剪${record.actualCuttingLength}m，余料${record.remnantLength}m`
            locationChange = '生产线加工'
            break
          case 'remnant':
            lengthChange = `+${record.length}m (余料入库)`
            locationChange = `生产线 → ${record.locationCode || '待分配'}`
            break
        }
        
        traceRecords.push({
          id: record.id,
          type: record.type,
          operateTime: record.operateTime,
          operator: record.operator,
          lengthChange,
          locationChange,
          remark: record.reason || record.cuttingRemark || ''
        })
      })
      
      // 按时间排序
      traceRecords.sort((a, b) => new Date(a.operateTime) - new Date(b.operateTime))
      
      return {
        success: true,
        data: traceRecords
      }
      
    } catch (error) {
      throw new Error(error.message)
    }
  },

  /**
   * 获取统计数据
   */
  async getStats() {
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const today = new Date().toISOString().slice(0, 10)
    
    // 今日领用数量
    const todayRequisitions = mockData.records.filter(r => 
      r.type === 'requisition' && r.operateTime.startsWith(today)
    ).length
    
    // 今日裁剪数量
    const todayCuttings = mockData.records.filter(r => 
      r.type === 'cutting' && r.operateTime.startsWith(today)
    ).length
    
    // 余料数量
    const totalRemnants = mockData.remnants.filter(r => r.status === 'pending').length
    
    // 计算利用率（简化计算）
    const totalRequisitioned = mockData.records
      .filter(r => r.type === 'requisition')
      .reduce((sum, r) => sum + r.requisitionLength, 0)
    
    const totalCut = mockData.records
      .filter(r => r.type === 'cutting')
      .reduce((sum, r) => sum + r.actualCuttingLength, 0)
    
    const utilizationRate = totalRequisitioned > 0 ? 
      Math.round((totalCut / totalRequisitioned) * 100) : 0
    
    return {
      success: true,
      data: {
        totalRequisitions: todayRequisitions,
        totalCuttings: todayCuttings,
        totalRemnants: totalRemnants,
        utilizationRate: utilizationRate
      }
    }
  }
}

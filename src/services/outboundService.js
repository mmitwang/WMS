/**
 * 严牌滤布卷材出库智能拣选服务
 * 实现FIFO出库策略、智能拣选路径优化、批量出库处理等功能
 */

import request from '@/utils/request'

/**
 * 出库单状态枚举
 */
export const OUTBOUND_STATUS = {
  PENDING: 'pending',      // 待处理
  PICKING: 'picking',      // 拣选中
  PICKED: 'picked',        // 已拣选
  SHIPPED: 'shipped',      // 已发货
  CANCELLED: 'cancelled'   // 已取消
}

/**
 * 拣选策略枚举
 */
export const PICKING_STRATEGY = {
  FIFO: 'fifo',           // 先进先出
  LIFO: 'lifo',           // 后进先出
  NEAREST: 'nearest',     // 就近拣选
  BATCH: 'batch'          // 批次拣选
}

/**
 * 出库服务类
 */
class OutboundService {
  /**
   * 创建出库单
   * @param {Object} outboundData 出库单数据
   * @returns {Promise<Object>} 创建结果
   */
  async createOutboundOrder(outboundData) {
    // 数据验证
    this.validateOutboundData(outboundData)
    
    // 生成出库单号
    const orderNo = this.generateOutboundOrderNo()
    
    const orderData = {
      ...outboundData,
      orderNo,
      status: OUTBOUND_STATUS.PENDING,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }

    try {
      const response = await request.post('/api/outbound/orders', orderData)
      return {
        success: true,
        data: response.data,
        message: '出库单创建成功'
      }
    } catch (error) {
      return {
        success: false,
        message: `创建出库单失败: ${error.message}`
      }
    }
  }

  /**
   * 智能拣选推荐
   * @param {Array} items 出库商品列表
   * @param {String} strategy 拣选策略
   * @returns {Promise<Object>} 拣选推荐结果
   */
  async getPickingRecommendation(items, strategy = PICKING_STRATEGY.FIFO) {
    try {
      // 验证拣选商品
      this.validatePickingItems(items)
      
      // 获取库存信息
      const inventory = await this.getInventoryForPicking(items)
      
      // 根据策略生成拣选推荐
      const recommendation = this.generatePickingRecommendation(inventory, items, strategy)
      
      return {
        success: true,
        data: recommendation,
        message: '拣选推荐生成成功'
      }
    } catch (error) {
      return {
        success: false,
        message: `拣选推荐失败: ${error.message}`
      }
    }
  }

  /**
   * 执行拣选操作
   * @param {String} orderNo 出库单号
   * @param {Array} pickingList 拣选清单
   * @returns {Promise<Object>} 拣选结果
   */
  async executePicking(orderNo, pickingList) {
    try {
      // 验证拣选清单
      this.validatePickingList(pickingList)
      
      // 检查库存可用性
      const stockCheck = await this.checkStockAvailability(pickingList)
      if (!stockCheck.success) {
        throw new Error(stockCheck.message)
      }
      
      // 执行拣选
      const pickingResult = await this.performPicking(orderNo, pickingList)
      
      // 更新库存
      await this.updateInventoryAfterPicking(pickingList)
      
      // 更新出库单状态
      await this.updateOutboundStatus(orderNo, OUTBOUND_STATUS.PICKED)
      
      return {
        success: true,
        data: pickingResult,
        message: '拣选操作完成'
      }
    } catch (error) {
      return {
        success: false,
        message: `拣选操作失败: ${error.message}`
      }
    }
  }

  /**
   * 批量出库处理
   * @param {Array} orders 出库单列表
   * @returns {Promise<Object>} 批量处理结果
   */
  async batchOutbound(orders) {
    try {
      const results = []
      const errors = []
      
      for (const order of orders) {
        try {
          const result = await this.processOutboundOrder(order)
          results.push(result)
        } catch (error) {
          errors.push({
            orderNo: order.orderNo,
            error: error.message
          })
        }
      }
      
      return {
        success: errors.length === 0,
        data: {
          processed: results.length,
          errors: errors.length,
          results,
          errorDetails: errors
        },
        message: `批量处理完成，成功${results.length}个，失败${errors.length}个`
      }
    } catch (error) {
      return {
        success: false,
        message: `批量出库处理失败: ${error.message}`
      }
    }
  }

  /**
   * 生成出库单
   * @param {String} orderNo 出库单号
   * @returns {Promise<Object>} 出库单数据
   */
  async generateOutboundDocument(orderNo) {
    try {
      const orderData = await this.getOutboundOrderDetails(orderNo)
      
      const document = {
        orderNo: orderData.orderNo,
        customerName: orderData.customerName,
        createTime: orderData.createTime,
        items: orderData.items,
        totalQuantity: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: orderData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0),
        pickingPath: orderData.pickingPath,
        operator: orderData.operator,
        notes: orderData.notes
      }
      
      return {
        success: true,
        data: document,
        message: '出库单生成成功'
      }
    } catch (error) {
      return {
        success: false,
        message: `出库单生成失败: ${error.message}`
      }
    }
  }

  /**
   * 获取出库统计数据
   * @param {Object} params 查询参数
   * @returns {Promise<Object>} 统计数据
   */
  async getOutboundStatistics(params = {}) {
    try {
      const { startDate, endDate, customerName, status } = params
      
      const response = await request.get('/api/outbound/statistics', {
        params: { startDate, endDate, customerName, status }
      })
      
      const statistics = {
        totalOrders: response.data.totalOrders || 0,
        totalQuantity: response.data.totalQuantity || 0,
        totalAmount: response.data.totalAmount || 0,
        avgPickingTime: response.data.avgPickingTime || 0,
        pickingEfficiency: response.data.pickingEfficiency || 0,
        statusDistribution: response.data.statusDistribution || {},
        dailyTrend: response.data.dailyTrend || []
      }
      
      return {
        success: true,
        data: statistics,
        message: '统计数据获取成功'
      }
    } catch (error) {
      return {
        success: false,
        message: `获取统计数据失败: ${error.message}`
      }
    }
  }

  /**
   * 验证出库数据
   * @param {Object} data 出库数据
   */
  validateOutboundData(data) {
    if (!data) {
      throw new Error('出库数据不能为空')
    }
    
    if (!data.customerName || typeof data.customerName !== 'string') {
      throw new Error('客户名称必须是有效字符串')
    }
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('出库商品列表不能为空')
    }
    
    // 验证商品信息
    data.items.forEach((item, index) => {
      if (!item.materialCode || typeof item.materialCode !== 'string') {
        throw new Error(`第${index + 1}个商品的物料编码无效`)
      }
      
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new Error(`第${index + 1}个商品的数量必须大于0`)
      }
    })
  }

  /**
   * 验证拣选商品
   * @param {Array} items 商品列表
   */
  validatePickingItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('拣选商品列表不能为空')
    }
    
    items.forEach((item, index) => {
      if (!item.materialCode) {
        throw new Error(`第${index + 1}个商品缺少物料编码`)
      }
      
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`第${index + 1}个商品数量无效`)
      }
    })
  }

  /**
   * 验证拣选清单
   * @param {Array} pickingList 拣选清单
   */
  validatePickingList(pickingList) {
    if (!Array.isArray(pickingList) || pickingList.length === 0) {
      throw new Error('拣选清单不能为空')
    }
    
    pickingList.forEach((item, index) => {
      if (!item.materialCode || !item.location || !item.quantity) {
        throw new Error(`第${index + 1}个拣选项信息不完整`)
      }
      
      if (item.quantity <= 0) {
        throw new Error(`第${index + 1}个拣选项数量必须大于0`)
      }
    })
  }

  /**
   * 生成出库单号
   * @returns {String} 出库单号
   */
  generateOutboundOrderNo() {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `OUT-${dateStr}-${timeStr}-${random}`
  }

  /**
   * 获取拣选库存信息
   * @param {Array} items 商品列表
   * @returns {Promise<Array>} 库存信息
   */
  async getInventoryForPicking(items) {
    const materialCodes = items.map(item => item.materialCode)
    
    try {
      const response = await request.post('/api/inventory/batch-query', {
        materialCodes
      })
      
      return response.data || []
    } catch (error) {
      throw new Error(`获取库存信息失败: ${error.message}`)
    }
  }

  /**
   * 生成拣选推荐
   * @param {Array} inventory 库存信息
   * @param {Array} items 需求商品
   * @param {String} strategy 拣选策略
   * @returns {Object} 拣选推荐
   */
  generatePickingRecommendation(inventory, items, strategy) {
    const recommendations = []
    
    items.forEach(item => {
      const availableStock = inventory.filter(stock => 
        stock.materialCode === item.materialCode && stock.quantity > 0
      )
      
      if (availableStock.length === 0) {
        throw new Error(`物料 ${item.materialCode} 库存不足`)
      }
      
      // 根据策略排序库存
      const sortedStock = this.sortStockByStrategy(availableStock, strategy)
      
      // 分配库存
      let remainingQuantity = item.quantity
      const allocation = []
      
      for (const stock of sortedStock) {
        if (remainingQuantity <= 0) break
        
        const allocatedQuantity = Math.min(remainingQuantity, stock.quantity)
        allocation.push({
          materialCode: stock.materialCode,
          location: stock.location,
          batchNo: stock.batchNo,
          quantity: allocatedQuantity,
          inboundDate: stock.inboundDate
        })
        
        remainingQuantity -= allocatedQuantity
      }
      
      if (remainingQuantity > 0) {
        throw new Error(`物料 ${item.materialCode} 库存不足，缺少 ${remainingQuantity}`)
      }
      
      recommendations.push({
        materialCode: item.materialCode,
        requestedQuantity: item.quantity,
        allocation
      })
    })
    
    // 生成拣选路径
    const pickingPath = this.generatePickingPath(recommendations)
    
    return {
      recommendations,
      pickingPath,
      totalItems: recommendations.length,
      estimatedTime: this.calculatePickingTime(pickingPath)
    }
  }

  /**
   * 根据策略排序库存
   * @param {Array} stock 库存列表
   * @param {String} strategy 拣选策略
   * @returns {Array} 排序后的库存
   */
  sortStockByStrategy(stock, strategy) {
    switch (strategy) {
      case PICKING_STRATEGY.FIFO:
        return stock.sort((a, b) => new Date(a.inboundDate) - new Date(b.inboundDate))
      
      case PICKING_STRATEGY.LIFO:
        return stock.sort((a, b) => new Date(b.inboundDate) - new Date(a.inboundDate))
      
      case PICKING_STRATEGY.NEAREST:
        return stock.sort((a, b) => a.location.localeCompare(b.location))
      
      case PICKING_STRATEGY.BATCH:
        return stock.sort((a, b) => a.batchNo.localeCompare(b.batchNo))
      
      default:
        return stock
    }
  }

  /**
   * 生成拣选路径
   * @param {Array} recommendations 拣选推荐
   * @returns {Array} 拣选路径
   */
  generatePickingPath(recommendations) {
    const allLocations = []
    
    recommendations.forEach(rec => {
      rec.allocation.forEach(alloc => {
        allLocations.push({
          location: alloc.location,
          materialCode: alloc.materialCode,
          quantity: alloc.quantity,
          batchNo: alloc.batchNo
        })
      })
    })
    
    // 按库位排序优化拣选路径
    return allLocations.sort((a, b) => a.location.localeCompare(b.location))
  }

  /**
   * 计算拣选时间
   * @param {Array} pickingPath 拣选路径
   * @returns {Number} 预估时间（分钟）
   */
  calculatePickingTime(pickingPath) {
    // 基础时间：每个库位2分钟
    const baseTime = pickingPath.length * 2
    
    // 移动时间：根据库位距离计算
    const moveTime = pickingPath.length * 0.5
    
    return Math.ceil(baseTime + moveTime)
  }

  /**
   * 检查库存可用性
   * @param {Array} pickingList 拣选清单
   * @returns {Promise<Object>} 检查结果
   */
  async checkStockAvailability(pickingList) {
    try {
      const response = await request.post('/api/inventory/check-availability', {
        items: pickingList
      })
      
      return {
        success: response.data.available,
        message: response.data.message || '库存检查完成'
      }
    } catch (error) {
      return {
        success: false,
        message: `库存检查失败: ${error.message}`
      }
    }
  }

  /**
   * 执行拣选操作
   * @param {String} orderNo 出库单号
   * @param {Array} pickingList 拣选清单
   * @returns {Promise<Object>} 拣选结果
   */
  async performPicking(orderNo, pickingList) {
    const response = await request.post('/api/outbound/picking', {
      orderNo,
      pickingList,
      pickingTime: new Date().toISOString()
    })
    
    return response.data
  }

  /**
   * 更新库存
   * @param {Array} pickingList 拣选清单
   * @returns {Promise<void>}
   */
  async updateInventoryAfterPicking(pickingList) {
    await request.post('/api/inventory/update-after-picking', {
      items: pickingList
    })
  }

  /**
   * 更新出库单状态
   * @param {String} orderNo 出库单号
   * @param {String} status 新状态
   * @returns {Promise<void>}
   */
  async updateOutboundStatus(orderNo, status) {
    await request.put(`/api/outbound/orders/${orderNo}/status`, {
      status,
      updateTime: new Date().toISOString()
    })
  }

  /**
   * 处理出库单
   * @param {Object} order 出库单
   * @returns {Promise<Object>} 处理结果
   */
  async processOutboundOrder(order) {
    // 获取拣选推荐
    const recommendation = await this.getPickingRecommendation(order.items)
    
    if (!recommendation.success) {
      throw new Error(recommendation.message)
    }
    
    // 执行拣选
    const pickingResult = await this.executePicking(order.orderNo, recommendation.data.recommendations)
    
    return pickingResult
  }

  /**
   * 获取出库单详情
   * @param {String} orderNo 出库单号
   * @returns {Promise<Object>} 出库单详情
   */
  async getOutboundOrderDetails(orderNo) {
    const response = await request.get(`/api/outbound/orders/${orderNo}`)
    return response.data
  }
}

// 导出服务实例
export default new OutboundService()

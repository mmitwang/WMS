// 腾腾电气WMS - 电气元器件管理服务
// Electrical Component Management Service

import request from '@/utils/request'

/**
 * 电气元器件管理服务类
 */
class ElectricalComponentService {
  
  /**
   * 获取电气元器件列表
   * @param {Object} params - 查询参数
   * @returns {Promise} 元器件列表
   */
  async getComponentList(params = {}) {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockData = {
        total: 156,
        list: [
          {
            id: 'TT-IC-001',
            name: '集成电路芯片',
            category: 'IC',
            model: 'STM32F407VGT6',
            manufacturer: 'STMicroelectronics',
            voltage: '3.3V',
            voltageLevel: 'low-voltage',
            mslLevel: 3,
            esdRequired: true,
            serialNumber: 'SN202601070001',
            batchNumber: 'B20260107001',
            quantity: 500,
            location: 'A01-01-01',
            temperature: '25°C',
            humidity: '45%RH',
            qualityReport: 'QR-TT-IC-001-20260107.pdf',
            installLocation: null,
            gpsCoordinates: null,
            status: 'in_stock',
            createdAt: '2026-01-07 10:00:00',
            updatedAt: '2026-01-07 14:00:00'
          },
          {
            id: 'TT-RES-002',
            name: '精密电阻',
            category: 'Resistor',
            model: 'RC0603FR-071KL',
            manufacturer: 'Yageo',
            voltage: '75V',
            voltageLevel: 'low-voltage',
            mslLevel: 1,
            esdRequired: false,
            serialNumber: 'SN202601070002',
            batchNumber: 'B20260107002',
            quantity: 10000,
            location: 'A02-03-05',
            temperature: '24°C',
            humidity: '40%RH',
            qualityReport: 'QR-TT-RES-002-20260107.pdf',
            installLocation: null,
            gpsCoordinates: null,
            status: 'in_stock',
            createdAt: '2026-01-07 09:30:00',
            updatedAt: '2026-01-07 13:45:00'
          },
          {
            id: 'TT-CAP-003',
            name: '电解电容',
            category: 'Capacitor',
            model: 'UPW1H101MPD',
            manufacturer: 'Nichicon',
            voltage: '50V',
            voltageLevel: 'low-voltage',
            mslLevel: 2,
            esdRequired: true,
            serialNumber: 'SN202601070003',
            batchNumber: 'B20260107003',
            quantity: 2000,
            location: 'A03-02-04',
            temperature: '23°C',
            humidity: '42%RH',
            qualityReport: 'QR-TT-CAP-003-20260107.pdf',
            installLocation: '浙江省杭州市西湖区文三路',
            gpsCoordinates: '30.2741,120.1551',
            status: 'installed',
            createdAt: '2026-01-07 08:15:00',
            updatedAt: '2026-01-07 12:30:00'
          },
          {
            id: 'TT-SW-004',
            name: '高压开关',
            category: 'Switch',
            model: 'ABB-VD4-40.5kV',
            manufacturer: 'ABB',
            voltage: '40.5kV',
            voltageLevel: 'high-voltage',
            mslLevel: 1,
            esdRequired: false,
            serialNumber: 'SN202601070004',
            batchNumber: 'B20260107004',
            quantity: 5,
            location: 'B01-01-01',
            temperature: '22°C',
            humidity: '38%RH',
            qualityReport: 'QR-TT-SW-004-20260107.pdf',
            installLocation: '浙江省宁波市北仑区',
            gpsCoordinates: '29.9097,121.6194',
            status: 'installed',
            createdAt: '2026-01-06 16:20:00',
            updatedAt: '2026-01-07 11:15:00'
          },
          {
            id: 'TT-CONN-005',
            name: '连接器',
            category: 'Connector',
            model: 'TE-1-1734742-0',
            manufacturer: 'TE Connectivity',
            voltage: '250V',
            voltageLevel: 'safe-voltage',
            mslLevel: 1,
            esdRequired: true,
            serialNumber: 'SN202601070005',
            batchNumber: 'B20260107005',
            quantity: 800,
            location: 'A04-05-02',
            temperature: '25°C',
            humidity: '43%RH',
            qualityReport: 'QR-TT-CONN-005-20260107.pdf',
            installLocation: null,
            gpsCoordinates: null,
            status: 'in_stock',
            createdAt: '2026-01-07 07:45:00',
            updatedAt: '2026-01-07 14:20:00'
          }
        ]
      }
      
      return {
        success: true,
        data: mockData,
        message: '获取电气元器件列表成功'
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `获取电气元器件列表失败: ${error.message}`
      }
    }
  }

  /**
   * 获取元器件详情
   * @param {string} id - 元器件ID
   * @returns {Promise} 元器件详情
   */
  async getComponentDetail(id) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const mockDetail = {
        id: id,
        name: '集成电路芯片',
        category: 'IC',
        model: 'STM32F407VGT6',
        manufacturer: 'STMicroelectronics',
        specifications: {
          voltage: '3.3V',
          current: '120mA',
          frequency: '168MHz',
          temperature: '-40°C to +85°C',
          package: 'LQFP100'
        },
        voltageLevel: 'low-voltage',
        mslLevel: 3,
        esdRequired: true,
        serialNumber: 'SN202601070001',
        batchNumber: 'B20260107001',
        quantity: 500,
        location: 'A01-01-01',
        storageConditions: {
          temperature: '25°C ± 2°C',
          humidity: '45%RH ± 5%',
          antiStatic: true,
          lightProof: true
        },
        qualityInfo: {
          report: 'QR-TT-IC-001-20260107.pdf',
          testDate: '2026-01-07',
          validUntil: '2027-01-07',
          certifications: ['ISO9001', 'RoHS', 'REACH']
        },
        installInfo: {
          location: null,
          gpsCoordinates: null,
          installDate: null,
          installer: null
        },
        lifecycle: [
          {
            stage: 'received',
            date: '2026-01-07 08:00:00',
            operator: '张三',
            notes: '货物入库检验合格'
          },
          {
            stage: 'quality_check',
            date: '2026-01-07 09:00:00',
            operator: '李四',
            notes: '质量检验通过'
          },
          {
            stage: 'stored',
            date: '2026-01-07 10:00:00',
            operator: '王五',
            notes: '已入库存储'
          }
        ],
        status: 'in_stock',
        createdAt: '2026-01-07 10:00:00',
        updatedAt: '2026-01-07 14:00:00'
      }
      
      return {
        success: true,
        data: mockDetail,
        message: '获取元器件详情成功'
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `获取元器件详情失败: ${error.message}`
      }
    }
  }

  /**
   * 添加电气元器件
   * @param {Object} componentData - 元器件数据
   * @returns {Promise} 添加结果
   */
  async addComponent(componentData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newComponent = {
        id: `TT-${componentData.category.toUpperCase()}-${Date.now()}`,
        ...componentData,
        serialNumber: this.generateSerialNumber(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'in_stock'
      }
      
      return {
        success: true,
        data: newComponent,
        message: '添加电气元器件成功'
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `添加电气元器件失败: ${error.message}`
      }
    }
  }

  /**
   * 更新元器件信息
   * @param {string} id - 元器件ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise} 更新结果
   */
  async updateComponent(id, updateData) {
    try {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        success: true,
        data: { id, ...updateData, updatedAt: new Date().toISOString() },
        message: '更新元器件信息成功'
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `更新元器件信息失败: ${error.message}`
      }
    }
  }

  /**
   * 删除元器件
   * @param {string} id - 元器件ID
   * @returns {Promise} 删除结果
   */
  async deleteComponent(id) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      return {
        success: true,
        data: null,
        message: '删除元器件成功'
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `删除元器件失败: ${error.message}`
      }
    }
  }

  /**
   * 获取库存统计
   * @returns {Promise} 库存统计数据
   */
  async getInventoryStats() {
    try {
      await new Promise(resolve => setTimeout(resolve, 400))
      
      const stats = {
        totalComponents: 156,
        totalValue: 2580000,
        categories: {
          'IC': { count: 45, value: 1200000 },
          'Resistor': { count: 38, value: 85000 },
          'Capacitor': { count: 32, value: 320000 },
          'Switch': { count: 15, value: 750000 },
          'Connector': { count: 26, value: 225000 }
        },
        voltageDistribution: {
          'high-voltage': 15,
          'low-voltage': 115,
          'safe-voltage': 26
        },
        mslDistribution: {
          'msl-1': 89,
          'msl-2': 32,
          'msl-3': 25,
          'msl-4': 8,
          'msl-5': 2,
          'msl-6': 0
        },
        esdRequired: 78,
        lowStockAlerts: 12,
        expiringSoon: 5
      }
      
      return {
        success: true,
        data: stats,
        message: '获取库存统计成功'
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `获取库存统计失败: ${error.message}`
      }
    }
  }

  /**
   * 获取周转率分析
   * @param {Object} params - 查询参数
   * @returns {Promise} 周转率数据
   */
  async getTurnoverAnalysis(params = {}) {
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const analysis = {
        overview: {
          averageTurnover: 4.2,
          fastMoving: 23,
          slowMoving: 15,
          deadStock: 3
        },
        categoryTurnover: [
          { category: 'IC', turnover: 5.8, trend: 'up' },
          { category: 'Resistor', turnover: 6.2, trend: 'up' },
          { category: 'Capacitor', turnover: 4.1, trend: 'stable' },
          { category: 'Switch', turnover: 2.3, trend: 'down' },
          { category: 'Connector', turnover: 3.9, trend: 'stable' }
        ],
        heatmapData: [
          { location: 'A01', turnover: 8.5, color: '#ff4d4f' },
          { location: 'A02', turnover: 6.2, color: '#fa8c16' },
          { location: 'A03', turnover: 4.8, color: '#fadb14' },
          { location: 'A04', turnover: 3.1, color: '#52c41a' },
          { location: 'B01', turnover: 1.9, color: '#1890ff' }
        ],
        monthlyTrend: [
          { month: '2025-07', turnover: 3.8 },
          { month: '2025-08', turnover: 4.1 },
          { month: '2025-09', turnover: 4.5 },
          { month: '2025-10', turnover: 4.3 },
          { month: '2025-11', turnover: 4.7 },
          { month: '2025-12', turnover: 4.2 },
          { month: '2026-01', turnover: 4.6 }
        ]
      }
      
      return {
        success: true,
        data: analysis,
        message: '获取周转率分析成功'
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `获取周转率分析失败: ${error.message}`
      }
    }
  }

  /**
   * 生成序列号
   * @returns {string} 序列号
   */
  generateSerialNumber() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    
    return `SN${year}${month}${day}${random}`
  }

  /**
   * 生成批次号
   * @returns {string} 批次号
   */
  generateBatchNumber() {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `B${year}${month}${day}${random}`
  }

  /**
   * 验证MSL等级
   * @param {number} level - MSL等级
   * @returns {boolean} 是否有效
   */
  validateMSLLevel(level) {
    return level >= 1 && level <= 6
  }

  /**
   * 获取电压等级
   * @param {string} voltage - 电压值
   * @returns {string} 电压等级
   */
  getVoltageLevel(voltage) {
    const numericVoltage = parseFloat(voltage)
    
    if (numericVoltage >= 1000) {
      return 'high-voltage'
    } else if (numericVoltage >= 50) {
      return 'low-voltage'
    } else {
      return 'safe-voltage'
    }
  }
}

export default new ElectricalComponentService()

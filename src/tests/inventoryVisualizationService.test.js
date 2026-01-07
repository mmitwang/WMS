/**
 * 严牌滤布卷材库存可视化与通用管理服务测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import inventoryVisualizationService from '@/services/inventoryVisualizationService'

// Mock request 模块
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}))

import request from '@/utils/request'

describe('严牌滤布卷材库存可视化与通用管理服务测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('3D可视化数据功能', () => {
    it('应该成功获取3D可视化数据', async () => {
      const mockData = {
        warehouseId: 'WH001',
        warehouseName: '主仓库',
        dimensions: { width: 100, height: 50, depth: 80 },
        areas: [
          {
            id: 'A001',
            name: 'A区',
            position: { x: 0, y: 0, z: 0 },
            capacity: 1000,
            utilization: 75,
            items: [
              {
                id: 'ITEM001',
                code: 'YP-ZCM-2.0-20260107-001',
                name: '针刺毡卷材',
                position: { x: 10, y: 0, z: 10 },
                dimensions: { width: 2, height: 1, depth: 1 },
                quantity: 50,
                status: 'normal'
              }
            ]
          }
        ],
        totalCapacity: 5000,
        usedCapacity: 3750,
        utilizationRate: 75,
        itemCount: 150,
        areaCount: 5,
        lastUpdate: '2026-01-07T13:20:00Z'
      }

      request.get.mockResolvedValue({ data: mockData })

      const params = {
        warehouseId: 'WH001',
        areaId: 'A001',
        materialType: 'ZCM'
      }

      const result = await inventoryVisualizationService.getInventory3DData(params)

      expect(request.get).toHaveBeenCalledWith('/api/inventory/3d-visualization', {
        params: {
          warehouseId: 'WH001',
          areaId: 'A001',
          materialType: 'ZCM',
          timestamp: expect.any(Number)
        }
      })

      expect(result).toHaveProperty('warehouse')
      expect(result.warehouse.id).toBe('WH001')
      expect(result.warehouse.name).toBe('主仓库')
      expect(result.warehouse.areas).toHaveLength(1)
      expect(result.warehouse.areas[0].items[0]).toHaveProperty('color')
      expect(result.statistics.totalCapacity).toBe(5000)
      expect(result.statistics.utilizationRate).toBe(75)
    })

    it('应该验证仓库ID参数', async () => {
      await expect(
        inventoryVisualizationService.getInventory3DData({})
      ).rejects.toThrow('仓库ID不能为空')
    })

    it('应该处理3D数据获取失败', async () => {
      request.get.mockRejectedValue(new Error('网络错误'))

      await expect(
        inventoryVisualizationService.getInventory3DData({ warehouseId: 'WH001' })
      ).rejects.toThrow('获取库存3D可视化数据失败')
    })
  })

  describe('库存报表分析功能', () => {
    it('应该成功获取汇总报表数据', async () => {
      const mockData = {
        totalValue: 1500000,
        totalQuantity: 500,
        categoryBreakdown: [
          { category: '针刺毡', value: 800000, percentage: 53.3 },
          { category: '机织滤布', value: 500000, percentage: 33.3 },
          { category: '过滤网带', value: 200000, percentage: 13.3 }
        ],
        topItems: [
          { code: 'YP-ZCM-2.0-20260107-001', name: '针刺毡卷材', value: 50000 }
        ],
        summary: { totalCategories: 3, avgValue: 3000 }
      }

      request.get.mockResolvedValue({ data: mockData })

      const params = {
        reportType: 'summary',
        dateRange: {
          startDate: '2026-01-01',
          endDate: '2026-01-07'
        },
        materialType: 'ZCM'
      }

      const result = await inventoryVisualizationService.getInventoryReport(params)

      expect(request.get).toHaveBeenCalledWith('/api/inventory/reports', {
        params: {
          reportType: 'summary',
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          materialType: 'ZCM',
          groupBy: 'material'
        }
      })

      expect(result.reportType).toBe('summary')
      expect(result.data.totalValue).toBe(1500000)
      expect(result.data.categoryBreakdown).toHaveLength(3)
      expect(result).toHaveProperty('generateTime')
    })

    it('应该成功获取详细报表数据', async () => {
      const mockData = {
        items: [
          {
            code: 'YP-ZCM-2.0-20260107-001',
            name: '针刺毡卷材',
            materialType: 'ZCM',
            width: 2.0,
            quantity: 50,
            value: 50000,
            location: 'A区-01',
            date: '2026-01-07'
          }
        ],
        pagination: { page: 1, pageSize: 20, total: 1 }
      }

      request.get.mockResolvedValue({ data: mockData })

      const result = await inventoryVisualizationService.getInventoryReport({
        reportType: 'detail'
      })

      expect(result.reportType).toBe('detail')
      expect(result.data.items).toHaveLength(1)
      expect(result.data.items[0]).toHaveProperty('formattedValue')
      expect(result.data.items[0]).toHaveProperty('formattedDate')
    })

    it('应该验证报表类型参数', async () => {
      await expect(
        inventoryVisualizationService.getInventoryReport({})
      ).rejects.toThrow('报表类型不能为空')

      await expect(
        inventoryVisualizationService.getInventoryReport({ reportType: 'invalid' })
      ).rejects.toThrow('无效的报表类型')
    })

    it('应该处理报表数据获取失败', async () => {
      request.get.mockRejectedValue(new Error('服务器错误'))

      await expect(
        inventoryVisualizationService.getInventoryReport({ reportType: 'summary' })
      ).rejects.toThrow('获取库存统计报表失败')
    })
  })

  describe('周转率分析功能', () => {
    it('应该成功获取周转率分析数据', async () => {
      const mockData = {
        period: 'monthly',
        overallTurnover: {
          rate: 8.5,
          trend: 'up',
          comparison: { lastPeriod: 7.2, change: 1.3 }
        },
        categoryAnalysis: [
          {
            category: '针刺毡',
            turnoverRate: 10.2,
            performance: 'good',
            avgDays: 36,
            suggestion: '保持当前库存水平'
          },
          {
            category: '机织滤布',
            turnoverRate: 6.8,
            performance: 'average',
            avgDays: 54,
            suggestion: '考虑减少库存'
          }
        ],
        recommendations: [
          '针刺毡周转率良好，建议保持当前库存策略',
          '机织滤布周转较慢，建议优化采购计划'
        ],
        chartData: [
          { period: '2025-12', rate: 7.2 },
          { period: '2026-01', rate: 8.5 }
        ],
        lastCalculated: '2026-01-07T13:20:00Z'
      }

      request.get.mockResolvedValue({ data: mockData })

      const params = {
        period: 'monthly',
        months: 12
      }

      const result = await inventoryVisualizationService.getInventoryTurnoverAnalysis(params)

      expect(request.get).toHaveBeenCalledWith('/api/inventory/turnover-analysis', {
        params: {
          period: 'monthly',
          months: 12,
          includeDetails: true
        }
      })

      expect(result.period).toBe('monthly')
      expect(result.overallTurnover.rate).toBe(8.5)
      expect(result.categoryAnalysis).toHaveLength(2)
      expect(result.categoryAnalysis[0].turnoverRate).toBe('10.20')
      expect(result.categoryAnalysis[0].performance).toBe('good')
      expect(result.recommendations).toHaveLength(2)
    })

    it('应该处理周转率分析失败并返回默认数据', async () => {
      request.get.mockRejectedValue(new Error('分析服务不可用'))

      const result = await inventoryVisualizationService.getInventoryTurnoverAnalysis({})

      expect(result.period).toBe('monthly')
      expect(result.overallTurnover.rate).toBe(0)
      expect(result.categoryAnalysis).toEqual([])
      expect(result.recommendations).toContain('暂无数据，请检查库存记录')
    })
  })

  describe('库存预警功能', () => {
    it('应该成功获取库存预警数据', async () => {
      const mockData = {
        alerts: [
          {
            id: 'ALERT001',
            type: 'stock',
            severity: 'high',
            title: '库存不足预警',
            description: '针刺毡库存低于安全库存',
            createTime: '2026-01-07T13:00:00Z'
          },
          {
            id: 'ALERT002',
            type: 'expiry',
            severity: 'medium',
            title: '即将过期预警',
            description: '部分滤布即将超过保质期',
            createTime: '2026-01-07T12:00:00Z'
          }
        ],
        total: 2,
        critical: 0,
        high: 1,
        medium: 1,
        low: 0,
        lastUpdate: '2026-01-07T13:20:00Z'
      }

      request.get.mockResolvedValue({ data: mockData })

      const params = {
        alertType: 'stock',
        severity: 'high'
      }

      const result = await inventoryVisualizationService.getInventoryAlerts(params)

      expect(request.get).toHaveBeenCalledWith('/api/inventory/alerts', {
        params: {
          alertType: 'stock',
          severity: 'high',
          status: 'active',
          limit: 50
        }
      })

      expect(result.alerts).toHaveLength(2)
      expect(result.alerts[0]).toHaveProperty('formattedTime')
      expect(result.alerts[0]).toHaveProperty('severityColor')
      expect(result.alerts[0]).toHaveProperty('actionRequired')
      expect(result.summary.total).toBe(2)
      expect(result.summary.high).toBe(1)
    })

    it('应该处理预警数据获取失败并返回默认数据', async () => {
      request.get.mockRejectedValue(new Error('预警服务异常'))

      const result = await inventoryVisualizationService.getInventoryAlerts({})

      expect(result.alerts).toEqual([])
      expect(result.summary.total).toBe(0)
      expect(result.summary.critical).toBe(0)
    })
  })

  describe('数据导出功能', () => {
    it('应该成功导出库存数据', async () => {
      const mockResponse = {
        downloadUrl: 'https://example.com/download/inventory_20260107.xlsx',
        fileName: 'inventory_20260107.xlsx',
        fileSize: 1024000
      }

      request.post.mockResolvedValue({ data: mockResponse })

      const params = {
        exportType: 'excel',
        dataType: 'inventory',
        filters: { materialType: 'ZCM' },
        includeCharts: true
      }

      const result = await inventoryVisualizationService.exportInventoryData(params)

      expect(request.post).toHaveBeenCalledWith('/api/inventory/export', {
        exportType: 'excel',
        dataType: 'inventory',
        filters: { materialType: 'ZCM' },
        includeCharts: true,
        timestamp: expect.any(Number)
      })

      expect(result.success).toBe(true)
      expect(result.downloadUrl).toBe(mockResponse.downloadUrl)
      expect(result.fileName).toBe(mockResponse.fileName)
      expect(result).toHaveProperty('exportTime')
    })

    it('应该验证导出参数', async () => {
      await expect(
        inventoryVisualizationService.exportInventoryData({})
      ).rejects.toThrow('导出类型和数据类型不能为空')

      await expect(
        inventoryVisualizationService.exportInventoryData({
          exportType: 'invalid',
          dataType: 'inventory'
        })
      ).rejects.toThrow('无效的导出类型')

      await expect(
        inventoryVisualizationService.exportInventoryData({
          exportType: 'excel',
          dataType: 'invalid'
        })
      ).rejects.toThrow('无效的数据类型')
    })

    it('应该处理导出失败', async () => {
      request.post.mockRejectedValue(new Error('导出服务异常'))

      await expect(
        inventoryVisualizationService.exportInventoryData({
          exportType: 'excel',
          dataType: 'inventory'
        })
      ).rejects.toThrow('导出库存数据失败')
    })
  })

  describe('数据导入功能', () => {
    it('应该成功导入库存数据', async () => {
      const mockFile = new File(['test content'], 'inventory.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const mockResponse = {
        success: true,
        totalRows: 100,
        successRows: 95,
        errorRows: 3,
        warningRows: 2,
        errors: [
          {
            row: 5,
            column: 'quantity',
            message: '数量格式错误',
            value: 'abc'
          }
        ],
        warnings: ['第10行：建议检查材质类型'],
        importId: 'IMP20260107001',
        importTime: '2026-01-07T13:20:00Z'
      }

      request.post.mockResolvedValue({ data: mockResponse })

      const params = {
        file: mockFile,
        importType: 'inventory',
        validateOnly: false
      }

      const result = await inventoryVisualizationService.importInventoryData(params)

      expect(request.post).toHaveBeenCalledWith(
        '/api/inventory/import',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      expect(result.success).toBe(true)
      expect(result.summary.totalRows).toBe(100)
      expect(result.summary.successRows).toBe(95)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].row).toBe(5)
      expect(result.importId).toBe('IMP20260107001')
    })

    it('应该验证导入参数', async () => {
      await expect(
        inventoryVisualizationService.importInventoryData({})
      ).rejects.toThrow('导入文件不能为空')

      await expect(
        inventoryVisualizationService.importInventoryData({
          file: new File(['test'], 'test.txt', { type: 'text/plain' })
        })
      ).rejects.toThrow('导入类型不能为空')

      await expect(
        inventoryVisualizationService.importInventoryData({
          file: new File(['test'], 'test.txt', { type: 'text/plain' }),
          importType: 'invalid'
        })
      ).rejects.toThrow('无效的导入类型')

      await expect(
        inventoryVisualizationService.importInventoryData({
          file: new File(['test'], 'test.txt', { type: 'text/plain' }),
          importType: 'inventory'
        })
      ).rejects.toThrow('仅支持Excel和CSV文件格式')

      // 测试文件大小限制
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      await expect(
        inventoryVisualizationService.importInventoryData({
          file: largeFile,
          importType: 'inventory'
        })
      ).rejects.toThrow('文件大小不能超过10MB')
    })

    it('应该处理导入失败', async () => {
      const mockFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      request.post.mockRejectedValue(new Error('导入服务异常'))

      await expect(
        inventoryVisualizationService.importInventoryData({
          file: mockFile,
          importType: 'inventory'
        })
      ).rejects.toThrow('导入库存数据失败')
    })
  })

  describe('系统配置功能', () => {
    it('应该成功获取系统配置', async () => {
      const mockConfig = {
        autoBackup: true,
        backupInterval: 24,
        logRetention: 90
      }

      request.get.mockResolvedValue({ data: mockConfig })

      const result = await inventoryVisualizationService.getSystemConfig('system')

      expect(request.get).toHaveBeenCalledWith('/api/system/config/system')
      expect(result).toEqual(mockConfig)
    })

    it('应该处理配置获取失败并返回默认配置', async () => {
      request.get.mockRejectedValue(new Error('配置服务异常'))

      const result = await inventoryVisualizationService.getSystemConfig('system')

      expect(result).toHaveProperty('autoBackup')
      expect(result).toHaveProperty('backupInterval')
      expect(result).toHaveProperty('logRetention')
    })

    it('应该成功更新系统配置', async () => {
      const mockResponse = {
        id: 'CONFIG001',
        autoBackup: false,
        backupInterval: 12,
        updateTime: '2026-01-07T13:20:00Z'
      }

      request.put.mockResolvedValue({ data: mockResponse })

      const configData = {
        autoBackup: false,
        backupInterval: 12
      }

      const result = await inventoryVisualizationService.updateSystemConfig('system', configData)

      expect(request.put).toHaveBeenCalledWith('/api/system/config/system', {
        ...configData,
        updateTime: expect.any(String),
        updatedBy: 'current_user'
      })

      expect(result.success).toBe(true)
      expect(result.message).toBe('系统配置更新成功')
      expect(result.config).toEqual(mockResponse)
    })

    it('应该验证配置数据', async () => {
      await expect(
        inventoryVisualizationService.updateSystemConfig('system', null)
      ).rejects.toThrow('配置数据格式无效')

      await expect(
        inventoryVisualizationService.updateSystemConfig('invalid', {})
      ).rejects.toThrow('无效的配置类型')
    })

    it('应该处理配置更新失败', async () => {
      request.put.mockRejectedValue(new Error('更新失败'))

      await expect(
        inventoryVisualizationService.updateSystemConfig('system', { autoBackup: true })
      ).rejects.toThrow('更新系统配置失败')
    })
  })

  describe('操作日志功能', () => {
    it('应该成功获取操作日志', async () => {
      const mockData = {
        logs: [
          {
            id: 'LOG001',
            module: 'inventory',
            operation: 'create',
            description: '创建库存记录',
            timestamp: '2026-01-07T13:00:00Z',
            userId: 'USER001',
            status: 'success'
          },
          {
            id: 'LOG002',
            module: 'warehouse',
            operation: 'update',
            description: '更新仓库信息',
            timestamp: '2026-01-07T12:30:00Z',
            userId: 'USER002',
            status: 'success'
          }
        ],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 2
        },
        summary: {
          totalLogs: 2,
          successCount: 2,
          errorCount: 0
        }
      }

      request.get.mockResolvedValue({ data: mockData })

      const params = {
        module: 'inventory',
        operation: 'create',
        dateRange: {
          startDate: '2026-01-07',
          endDate: '2026-01-07'
        },
        page: 1,
        pageSize: 20
      }

      const result = await inventoryVisualizationService.getOperationLogs(params)

      expect(request.get).toHaveBeenCalledWith('/api/system/operation-logs', {
        params: {
          module: 'inventory',
          operation: 'create',
          startDate: '2026-01-07',
          endDate: '2026-01-07',
          userId: undefined,
          page: 1,
          pageSize: 20
        }
      })

      expect(result.logs).toHaveLength(2)
      expect(result.logs[0]).toHaveProperty('formattedTime')
      expect(result.logs[0]).toHaveProperty('moduleDisplay')
      expect(result.logs[0]).toHaveProperty('operationDisplay')
      expect(result.logs[0]).toHaveProperty('statusColor')
      expect(result.pagination.total).toBe(2)
    })

    it('应该处理日志获取失败并返回默认数据', async () => {
      request.get.mockRejectedValue(new Error('日志服务异常'))

      const result = await inventoryVisualizationService.getOperationLogs({})

      expect(result.logs).toEqual([])
      expect(result.pagination.total).toBe(0)
    })

    it('应该成功记录操作日志', async () => {
      const mockResponse = {
        logId: 'LOG20260107001'
      }

      request.post.mockResolvedValue({ data: mockResponse })

      const logData = {
        module: 'inventory',
        operation: 'create',
        description: '创建新的库存记录',
        details: { itemCode: 'YP-ZCM-2.0-20260107-001' }
      }

      const result = await inventoryVisualizationService.recordOperationLog(logData)

      expect(request.post).toHaveBeenCalledWith('/api/system/operation-logs', {
        ...logData,
        timestamp: expect.any(String),
        userId: 'current_user',
        ip: 'client_ip',
        userAgent: expect.any(String)
      })

      expect(result.success).toBe(true)
      expect(result.logId).toBe('LOG20260107001')
    })

    it('应该验证日志数据', async () => {
      await expect(
        inventoryVisualizationService.recordOperationLog({})
      ).rejects.toThrow('模块名称和操作类型不能为空')

      await expect(
        inventoryVisualizationService.recordOperationLog({
          module: 'inventory',
          operation: 'create'
        })
      ).rejects.toThrow('操作描述不能为空')
    })

    it('应该处理日志记录失败但不抛出异常', async () => {
      request.post.mockRejectedValue(new Error('日志服务异常'))

      const result = await inventoryVisualizationService.recordOperationLog({
        module: 'inventory',
        operation: 'create',
        description: '测试日志'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('日志服务异常')
    })
  })

  describe('工具方法测试', () => {
    it('应该正确获取物品颜色', () => {
      const service = inventoryVisualizationService

      expect(service.getItemColor('error', 50)).toBe('#ff4757')
      expect(service.getItemColor('normal', 95)).toBe('#ff6b6b')
      expect(service.getItemColor('normal', 75)).toBe('#ffa502')
      expect(service.getItemColor('normal', 55)).toBe('#26de81')
      expect(service.getItemColor('normal', 30)).toBe('#45aaf2')
    })

    it('应该正确获取周转率性能等级', () => {
      const service = inventoryVisualizationService

      expect(service.getTurnoverPerformance(15)).toBe('excellent')
      expect(service.getTurnoverPerformance(10)).toBe('good')
      expect(service.getTurnoverPerformance(6)).toBe('average')
      expect(service.getTurnoverPerformance(2)).toBe('poor')
    })

    it('应该正确获取严重程度颜色', () => {
      const service = inventoryVisualizationService

      expect(service.getSeverityColor('critical')).toBe('#ff4757')
      expect(service.getSeverityColor('high')).toBe('#ff6b6b')
      expect(service.getSeverityColor('medium')).toBe('#ffa502')
      expect(service.getSeverityColor('low')).toBe('#26de81')
      expect(service.getSeverityColor('unknown')).toBe('#747d8c')
    })

    it('应该正确获取所需操作', () => {
      const service = inventoryVisualizationService

      expect(service.getActionRequired('stock', 'critical')).toBe('立即处理')
      expect(service.getActionRequired('stock', 'high')).toBe('24小时内处理')
      expect(service.getActionRequired('stock', 'medium')).toBe('3天内处理')
      expect(service.getActionRequired('stock', 'low')).toBe('关注即可')
    })

    it('应该正确格式化货币', () => {
      const service = inventoryVisualizationService

      expect(service.formatCurrency(1000)).toBe('¥1,000.00')
      expect(service.formatCurrency(0)).toBe('¥0.00')
      expect(service.formatCurrency(null)).toBe('¥0.00')
    })

    it('应该正确格式化日期', () => {
      const service = inventoryVisualizationService
      const testDate = '2026-01-07T13:20:00Z'

      const result = service.formatDate(testDate)
      expect(result).toMatch(/2026/)
      expect(result).toMatch(/1/)
      expect(result).toMatch(/7/)
    })

    it('应该正确格式化日期时间', () => {
      const service = inventoryVisualizationService
      const testDateTime = '2026-01-07T13:20:00Z'

      const result = service.formatDateTime(testDateTime)
      expect(result).toMatch(/2026/)
      expect(result).toMatch(/13:20/)
    })
  })

  describe('数据格式化测试', () => {
    it('应该正确格式化3D可视化数据', () => {
      const service = inventoryVisualizationService
      const rawData = {
        warehouseId: 'WH001',
        warehouseName: '主仓库',
        dimensions: { width: 100, height: 50 },
        areas: [
          {
            id: 'A001',
            name: 'A区',
            utilization: 75,
            items: [
              {
                id: 'ITEM001',
                code: 'YP-ZCM-2.0-20260107-001',
                status: 'normal',
                utilization: 80
              }
            ]
          }
        ],
        totalCapacity: 1000,
        usedCapacity: 750,
        utilizationRate: 75,
        itemCount: 50,
        areaCount: 3
      }

      const result = service.format3DVisualizationData(rawData)

      expect(result.warehouse.id).toBe('WH001')
      expect(result.warehouse.name).toBe('主仓库')
      expect(result.warehouse.areas[0].items[0]).toHaveProperty('color')
      expect(result.statistics.totalCapacity).toBe(1000)
      expect(result.statistics.utilizationRate).toBe(75)
      expect(result).toHaveProperty('lastUpdate')
    })

    it('应该正确格式化报表数据', () => {
      const service = inventoryVisualizationService
      const rawData = {
        items: [
          {
            code: 'YP-ZCM-2.0-20260107-001',
            name: '针刺毡卷材',
            value: 50000,
            date: '2026-01-07T13:20:00Z'
          }
        ]
      }

      const result = service.formatReportData(rawData, 'detail')

      expect(result.reportType).toBe('detail')
      expect(result.data.items[0]).toHaveProperty('formattedValue')
      expect(result.data.items[0]).toHaveProperty('formattedDate')
      expect(result).toHaveProperty('generateTime')
    })

    it('应该正确格式化周转率数据', () => {
      const service = inventoryVisualizationService
      const rawData = {
        categoryAnalysis: [
          {
            category: '针刺毡',
            turnoverRate: 10.234,
            performance: 'good'
          }
        ]
      }

      const result = service.formatTurnoverData(rawData)

      expect(result.categoryAnalysis[0].turnoverRate).toBe('10.23')
      expect(result.categoryAnalysis[0].performance).toBe('good')
    })

    it('应该正确格式化预警数据', () => {
      const service = inventoryVisualizationService
      const rawData = {
        alerts: [
          {
            id: 'ALERT001',
            type: 'stock',
            severity: 'high',
            createTime: '2026-01-07T13:00:00Z'
          }
        ]
      }

      const result = service.formatAlertData(rawData)

      expect(result.alerts[0]).toHaveProperty('formattedTime')
      expect(result.alerts[0]).toHaveProperty('severityColor')
      expect(result.alerts[0]).toHaveProperty('actionRequired')
    })

    it('应该正确格式化日志数据', () => {
      const service = inventoryVisualizationService
      const rawData = {
        logs: [
          {
            id: 'LOG001',
            module: 'inventory',
            operation: 'create',
            timestamp: '2026-01-07T13:00:00Z',
            status: 'success'
          }
        ]
      }

      const result = service.formatLogData(rawData)

      expect(result.logs[0]).toHaveProperty('formattedTime')
      expect(result.logs[0]).toHaveProperty('moduleDisplay')
      expect(result.logs[0]).toHaveProperty('operationDisplay')
      expect(result.logs[0]).toHaveProperty('statusColor')
    })
  })
})

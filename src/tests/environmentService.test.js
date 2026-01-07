import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock request module
vi.mock('@/utils/request', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

import environmentService, {
  validateEnvironmentData,
  validateThreshold,
  assessEnvironmentStatus,
  generateEnvironmentAlert,
  calculateComfortIndex,
  analyzeEnvironmentData
} from '@/services/environmentService'

describe('环境监控服务测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('环境数据验证功能', () => {
    it('应该验证完整的环境数据', () => {
      const validData = {
        temperature: 22.5,
        humidity: 55.0,
        zoneId: 'ZONE-001',
        timestamp: '2026-01-07T12:00:00.000Z'
      }

      const result = validateEnvironmentData(validData)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测空数据', () => {
      const result = validateEnvironmentData(null)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('环境数据不能为空')
    })

    it('应该验证温度数据类型', () => {
      const invalidData = {
        temperature: '22.5', // 字符串而不是数字
        humidity: 55.0
      }

      const result = validateEnvironmentData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('温度必须是数字类型')
    })

    it('应该验证温度范围', () => {
      const invalidData = {
        temperature: 100, // 超出合理范围
        humidity: 55.0
      }

      const result = validateEnvironmentData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('温度值超出合理范围(-50°C ~ 80°C)')
    })

    it('应该验证湿度数据类型和范围', () => {
      const invalidData1 = {
        temperature: 22.5,
        humidity: '55' // 字符串类型
      }

      const invalidData2 = {
        temperature: 22.5,
        humidity: 150 // 超出范围
      }

      const result1 = validateEnvironmentData(invalidData1)
      expect(result1.isValid).toBe(false)
      expect(result1.errors).toContain('湿度必须是数字类型')

      const result2 = validateEnvironmentData(invalidData2)
      expect(result2.isValid).toBe(false)
      expect(result2.errors).toContain('湿度值必须在0-100%之间')
    })

    it('应该验证存储区域ID类型', () => {
      const invalidData = {
        temperature: 22.5,
        humidity: 55.0,
        zoneId: 123 // 数字而不是字符串
      }

      const result = validateEnvironmentData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('存储区域ID必须是字符串类型')
    })

    it('应该验证时间戳格式', () => {
      const invalidData = {
        temperature: 22.5,
        humidity: 55.0,
        timestamp: 'invalid-date'
      }

      const result = validateEnvironmentData(invalidData)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('时间戳格式无效')
    })
  })

  describe('环境阈值验证功能', () => {
    it('应该验证完整的阈值配置', () => {
      const validThreshold = {
        temperature: { min: 15, max: 25 },
        humidity: { min: 45, max: 65 }
      }

      const result = validateThreshold(validThreshold)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测空阈值配置', () => {
      const result = validateThreshold(null)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('阈值配置不能为空')
    })

    it('应该验证温度阈值数据类型', () => {
      const invalidThreshold = {
        temperature: { min: '15', max: 25 } // min是字符串
      }

      const result = validateThreshold(invalidThreshold)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('温度阈值必须是数字类型')
    })

    it('应该验证温度阈值逻辑关系', () => {
      const invalidThreshold = {
        temperature: { min: 25, max: 15 } // min > max
      }

      const result = validateThreshold(invalidThreshold)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('温度最小值必须小于最大值')
    })

    it('应该验证湿度阈值范围', () => {
      const invalidThreshold = {
        humidity: { min: -10, max: 120 } // 超出0-100范围
      }

      const result = validateThreshold(invalidThreshold)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('湿度阈值必须在0-100%之间')
    })
  })

  describe('环境状态评估功能', () => {
    const threshold = {
      temperature: { min: 15, max: 25 },
      humidity: { min: 45, max: 65 }
    }

    it('应该评估正常环境状态', () => {
      const normalData = {
        temperature: 20,
        humidity: 55
      }

      const result = assessEnvironmentStatus(normalData, threshold)
      expect(result.status).toBe('normal')
      expect(result.message).toBe('环境正常')
    })

    it('应该检测温度过低警告', () => {
      const lowTempData = {
        temperature: 10,
        humidity: 55
      }

      const result = assessEnvironmentStatus(lowTempData, threshold)
      expect(result.status).toBe('warning')
      expect(result.message).toContain('温度过低')
    })

    it('应该检测湿度过高警告', () => {
      const highHumidityData = {
        temperature: 20,
        humidity: 80
      }

      const result = assessEnvironmentStatus(highHumidityData, threshold)
      expect(result.status).toBe('warning')
      expect(result.message).toContain('湿度过高')
    })

    it('应该检测多项异常并标记为严重', () => {
      const criticalData = {
        temperature: 30, // 过高
        humidity: 30    // 过低
      }

      const result = assessEnvironmentStatus(criticalData, threshold)
      expect(result.status).toBe('critical')
      expect(result.message).toContain('多项异常')
    })

    it('应该处理数据不完整的情况', () => {
      const result = assessEnvironmentStatus(null, threshold)
      expect(result.status).toBe('unknown')
      expect(result.message).toBe('数据不完整')
    })
  })

  describe('环境预警生成功能', () => {
    const threshold = {
      temperature: { min: 15, max: 25 },
      humidity: { min: 45, max: 65 }
    }

    const zoneInfo = {
      name: '存储区域A'
    }

    it('应该为异常环境生成预警', () => {
      const abnormalData = {
        zoneId: 'ZONE-001',
        temperature: 30,
        humidity: 55
      }

      const alert = generateEnvironmentAlert(abnormalData, threshold, zoneInfo)
      expect(alert).not.toBeNull()
      expect(alert.zoneId).toBe('ZONE-001')
      expect(alert.zoneName).toBe('存储区域A')
      expect(alert.level).toBe('medium')
      expect(alert.type).toBe('environment')
      expect(alert.status).toBe('pending')
    })

    it('应该为严重异常生成高级别预警', () => {
      const criticalData = {
        zoneId: 'ZONE-001',
        temperature: 35, // 严重过高
        humidity: 30    // 严重过低
      }

      const alert = generateEnvironmentAlert(criticalData, threshold, zoneInfo)
      expect(alert).not.toBeNull()
      expect(alert.level).toBe('high')
    })

    it('应该为正常环境返回null', () => {
      const normalData = {
        zoneId: 'ZONE-001',
        temperature: 20,
        humidity: 55
      }

      const alert = generateEnvironmentAlert(normalData, threshold, zoneInfo)
      expect(alert).toBeNull()
    })

    it('应该处理未知区域信息', () => {
      const abnormalData = {
        zoneId: 'ZONE-001',
        temperature: 30,
        humidity: 55
      }

      const alert = generateEnvironmentAlert(abnormalData, threshold, null)
      expect(alert.zoneName).toBe('未知区域')
    })
  })

  describe('环境舒适度计算功能', () => {
    it('应该计算最优条件的舒适度', () => {
      const result = calculateComfortIndex(20, 55) // 最适宜条件
      expect(result.index).toBe(100)
      expect(result.level).toBe('excellent')
      expect(result.temperature.optimal).toBe(20)
      expect(result.humidity.optimal).toBe(55)
    })

    it('应该计算偏离最优条件的舒适度', () => {
      const result = calculateComfortIndex(25, 60) // 轻微偏离
      expect(result.index).toBeGreaterThan(50)
      expect(result.index).toBeLessThan(100)
      expect(result.level).toBe('poor')
    })

    it('应该计算较差环境的舒适度', () => {
      const result = calculateComfortIndex(35, 80) // 严重偏离
      expect(result.index).toBeLessThan(60)
      expect(result.level).toBe('critical')
    })

    it('应该处理无效输入', () => {
      const result1 = calculateComfortIndex('20', 55)
      const result2 = calculateComfortIndex(20, null)
      
      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })

    it('应该正确计算温湿度偏差', () => {
      const result = calculateComfortIndex(18, 50)
      expect(result.temperature.deviation).toBe(2.0) // |18-20|
      expect(result.humidity.deviation).toBe(5.0)    // |50-55|
    })
  })

  describe('环境数据统计分析功能', () => {
    const sampleData = [
      { temperature: 18, humidity: 50, timestamp: '2026-01-07T08:00:00Z' },
      { temperature: 20, humidity: 55, timestamp: '2026-01-07T12:00:00Z' },
      { temperature: 22, humidity: 60, timestamp: '2026-01-07T16:00:00Z' },
      { temperature: 19, humidity: 52, timestamp: '2026-01-07T20:00:00Z' }
    ]

    it('应该分析环境数据统计信息', () => {
      const analysis = analyzeEnvironmentData(sampleData)
      
      expect(analysis).not.toBeNull()
      expect(analysis.period.count).toBe(4)
      expect(analysis.temperature.min).toBe(18)
      expect(analysis.temperature.max).toBe(22)
      expect(analysis.temperature.avg).toBe(19.8) // (18+20+22+19)/4
      expect(analysis.humidity.min).toBe(50)
      expect(analysis.humidity.max).toBe(60)
      expect(analysis.humidity.avg).toBe(54.3) // (50+55+60+52)/4
    })

    it('应该计算当前舒适度', () => {
      const analysis = analyzeEnvironmentData(sampleData)
      expect(analysis.comfort).not.toBeNull()
      expect(analysis.comfort.index).toBeGreaterThan(0)
    })

    it('应该处理空数据', () => {
      const analysis = analyzeEnvironmentData([])
      expect(analysis).toBeNull()
    })

    it('应该处理无效数据', () => {
      const analysis = analyzeEnvironmentData(null)
      expect(analysis).toBeNull()
    })

    it('应该过滤无效的温湿度值', () => {
      const mixedData = [
        { temperature: 20, humidity: 55 },
        { temperature: null, humidity: 'invalid' },
        { temperature: 22, humidity: 60 }
      ]

      const analysis = analyzeEnvironmentData(mixedData)
      expect(analysis.temperature.avg).toBe(21) // (20+22)/2
      expect(analysis.humidity.avg).toBe(57.5)  // (55+60)/2
    })

    it('应该设置正确的时间范围', () => {
      const analysis = analyzeEnvironmentData(sampleData)
      expect(analysis.period.start).toBe('2026-01-07T08:00:00Z')
      expect(analysis.period.end).toBe('2026-01-07T20:00:00Z')
    })
  })

  describe('API接口功能', () => {
    it('应该调用获取环境数据API', async () => {
      const mockRequest = await import('@/utils/request')
      mockRequest.default.get.mockResolvedValue({ data: [] })

      await environmentService.environmentAPI.getEnvironmentData({ zoneId: 'ZONE-001' })
      
      expect(mockRequest.default.get).toHaveBeenCalledWith('/api/environment/data', {
        params: { zoneId: 'ZONE-001' }
      })
    })

    it('应该调用设置阈值API', async () => {
      const mockRequest = await import('@/utils/request')
      mockRequest.default.post.mockResolvedValue({ success: true })

      const thresholdData = {
        zoneId: 'ZONE-001',
        temperature: { min: 15, max: 25 }
      }

      await environmentService.environmentAPI.setThreshold(thresholdData)
      
      expect(mockRequest.default.post).toHaveBeenCalledWith('/api/environment/threshold', thresholdData)
    })

    it('应该调用处理预警API', async () => {
      const mockRequest = await import('@/utils/request')
      mockRequest.default.put.mockResolvedValue({ success: true })

      await environmentService.environmentAPI.handleAlert('ALERT-001', { status: 'resolved' })
      
      expect(mockRequest.default.put).toHaveBeenCalledWith('/api/environment/alerts/ALERT-001', { status: 'resolved' })
    })
  })
})

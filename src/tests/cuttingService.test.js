/**
 * 卷材裁剪管理服务测试用例
 * 测试裁剪领用、记录、余料管理等核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock request module first
vi.mock('../utils/request', () => ({
  default: vi.fn(),
  request: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
  upload: vi.fn(),
  download: vi.fn()
}))

import { 
  validateCuttingData,
  generateRemnantCode,
  calculateUtilizationRate
} from '../services/cuttingService'

describe('卷材裁剪管理服务测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('数据验证功能', () => {
    it('应该验证完整的裁剪数据', () => {
      const validData = {
        requestId: 'REQ-20260107-001',
        rollCode: 'YP-ZCM-2.0-20260107-001',
        actualLength: 48,
        wastage: 2,
        cuttingTime: '2026-01-07 14:30:00',
        operator: 'user001',
        qualityCheck: 'passed'
      }

      const validation = validateCuttingData(validData)

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('应该检测缺失的必填字段', () => {
      const incompleteData = {
        requestId: 'REQ-20260107-001',
        actualLength: 48
        // 缺少其他必填字段
      }

      const validation = validateCuttingData(incompleteData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('应该验证编码格式', () => {
      const invalidData = {
        requestId: 'INVALID-ID',
        rollCode: 'INVALID-CODE',
        actualLength: 48,
        wastage: 2,
        operator: 'user001'
      }

      const validation = validateCuttingData(invalidData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('卷材编码格式不正确')
    })

    it('应该验证裁剪数据完整性', () => {
      const invalidData = {
        requestId: 'REQ-20260107-001',
        rollCode: 'YP-ZCM-2.0-20260107-001',
        actualLength: -10, // 无效长度
        wastage: 2
      }

      const validation = validateCuttingData(invalidData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('实际长度必须大于0')
    })

    it('应该验证损耗合理性', () => {
      const invalidData = {
        requestId: 'REQ-20260107-001',
        rollCode: 'YP-ZCM-2.0-20260107-001',
        actualLength: 48,
        wastage: 25 // 损耗过高
      }

      const validation = validateCuttingData(invalidData)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('损耗率过高')
    })
  })

  describe('余料管理功能', () => {
    it('应该生成正确的余料编码', () => {
      const originalCode = 'YP-ZCM-2.0-20260107-001'
      const remnantCode = generateRemnantCode(originalCode, 1)

      expect(remnantCode).toBe('YP-ZCM-2.0-20260107-001-Y1')
    })

    it('应该生成多个余料编码', () => {
      const originalCode = 'YP-ZCM-2.0-20260107-001'
      
      const remnantCode1 = generateRemnantCode(originalCode, 1)
      const remnantCode2 = generateRemnantCode(originalCode, 2)
      const remnantCode3 = generateRemnantCode(originalCode, 3)

      expect(remnantCode1).toBe('YP-ZCM-2.0-20260107-001-Y1')
      expect(remnantCode2).toBe('YP-ZCM-2.0-20260107-001-Y2')
      expect(remnantCode3).toBe('YP-ZCM-2.0-20260107-001-Y3')
    })
  })

  describe('统计分析功能', () => {
    it('应该正确计算利用率', () => {
      const actualLength = 48
      const requestLength = 50

      const utilization = calculateUtilizationRate(actualLength, requestLength)

      expect(utilization).toBe(96)
    })

    it('应该处理零除错误', () => {
      const actualLength = 48
      const requestLength = 0

      const utilization = calculateUtilizationRate(actualLength, requestLength)

      expect(utilization).toBe(0)
    })

    it('应该处理完全利用的情况', () => {
      const actualLength = 50
      const requestLength = 50

      const utilization = calculateUtilizationRate(actualLength, requestLength)

      expect(utilization).toBe(100)
    })

    it('应该处理超出请求长度的情况', () => {
      const actualLength = 55
      const requestLength = 50

      const utilization = calculateUtilizationRate(actualLength, requestLength)

      expect(utilization).toBe(110)
    })
  })

  describe('业务规则验证', () => {
    it('应该验证余料最小长度规则', () => {
      const remnantData = {
        originalRollCode: 'YP-ZCM-2.0-20260107-001',
        remnantLength: 5, // 小于最小长度
        width: 2.0,
        weight: 2.5
      }

      // 假设最小余料长度为10米
      const minRemnantLength = 10
      const isValidRemnant = remnantData.remnantLength >= minRemnantLength

      expect(isValidRemnant).toBe(false)
    })

    it('应该验证有效余料长度', () => {
      const remnantData = {
        originalRollCode: 'YP-ZCM-2.0-20260107-001',
        remnantLength: 15, // 大于最小长度
        width: 2.0,
        weight: 7.5
      }

      // 假设最小余料长度为10米
      const minRemnantLength = 10
      const isValidRemnant = remnantData.remnantLength >= minRemnantLength

      expect(isValidRemnant).toBe(true)
    })

    it('应该验证操作员权限等级', () => {
      const operatorPermissions = {
        'user001': ['request', 'cut', 'record'],
        'user002': ['request'],
        'admin': ['request', 'cut', 'record', 'manage']
      }

      const hasPermission = (operator, action) => {
        return operatorPermissions[operator]?.includes(action) || false
      }

      expect(hasPermission('user001', 'cut')).toBe(true)
      expect(hasPermission('user002', 'cut')).toBe(false)
      expect(hasPermission('admin', 'manage')).toBe(true)
      expect(hasPermission('nonexistent', 'cut')).toBe(false)
    })

    it('应该验证FIFO出库规则优先级', () => {
      const rolls = [
        {
          rollCode: 'YP-ZCM-2.0-20260105-001',
          productionDate: '2026-01-05',
          availableLength: 120
        },
        {
          rollCode: 'YP-ZCM-2.0-20260106-001',
          productionDate: '2026-01-06',
          availableLength: 150
        },
        {
          rollCode: 'YP-ZCM-2.0-20260104-001',
          productionDate: '2026-01-04',
          availableLength: 80
        }
      ]

      // 按生产日期排序（FIFO）
      const sortedRolls = rolls.sort((a, b) => new Date(a.productionDate) - new Date(b.productionDate))

      expect(sortedRolls[0].rollCode).toBe('YP-ZCM-2.0-20260104-001')
      expect(sortedRolls[1].rollCode).toBe('YP-ZCM-2.0-20260105-001')
      expect(sortedRolls[2].rollCode).toBe('YP-ZCM-2.0-20260106-001')
    })
  })

  describe('编码格式验证', () => {
    it('应该验证正确的卷材编码格式', () => {
      const validCodes = [
        'YP-ZCM-2.0-20260107-001',
        'YP-JZB-1.5-20260107-002',
        'YP-GLW-3.0-20260107-003'
      ]

      const codePattern = /^YP-[A-Z]{3}-\d+\.\d+-\d{8}-\d{3}$/

      validCodes.forEach(code => {
        expect(codePattern.test(code)).toBe(true)
      })
    })

    it('应该拒绝无效的卷材编码格式', () => {
      const invalidCodes = [
        'INVALID-CODE',
        'YP-ZCM-2.0',
        'ZCM-2.0-20260107-001',
        'YP-ZCM-2.0-20260107',
        'YP-ZC-2.0-20260107-001' // 材质代码太短
      ]

      const codePattern = /^YP-[A-Z]{3}-\d+\.\d+-\d{8}-\d{3}$/

      invalidCodes.forEach(code => {
        expect(codePattern.test(code)).toBe(false)
      })
    })

    it('应该验证余料编码格式', () => {
      const originalCode = 'YP-ZCM-2.0-20260107-001'
      const remnantCodes = [
        generateRemnantCode(originalCode, 1),
        generateRemnantCode(originalCode, 2),
        generateRemnantCode(originalCode, 10)
      ]

      const remnantPattern = /^YP-[A-Z]{3}-\d+\.\d+-\d{8}-\d{3}-Y\d+$/

      remnantCodes.forEach(code => {
        expect(remnantPattern.test(code)).toBe(true)
      })
    })
  })

  describe('数据类型验证', () => {
    it('应该验证数值类型字段', () => {
      const testData = {
        actualLength: '48', // 字符串而不是数字
        wastage: 'invalid', // 无效数字
        width: 2.0,
        weight: 25
      }

      const isValidNumber = (value) => !isNaN(parseFloat(value)) && isFinite(value)

      expect(isValidNumber(testData.actualLength)).toBe(true) // 可转换为数字
      expect(isValidNumber(testData.wastage)).toBe(false) // 无效数字
      expect(isValidNumber(testData.width)).toBe(true)
      expect(isValidNumber(testData.weight)).toBe(true)
    })

    it('应该验证日期格式', () => {
      const validDates = [
        '2026-01-07 14:30:00',
        '2026-12-31 23:59:59',
        '2026-01-01 00:00:00'
      ]

      const invalidDates = [
        '2026-13-01 14:30:00', // 无效月份
        '2026-01-32 14:30:00', // 无效日期
        '2026-01-07 25:30:00', // 无效小时
        'invalid-date'
      ]

      const isValidDate = (dateString) => {
        const date = new Date(dateString)
        return date instanceof Date && !isNaN(date)
      }

      validDates.forEach(date => {
        expect(isValidDate(date)).toBe(true)
      })

      invalidDates.forEach(date => {
        expect(isValidDate(date)).toBe(false)
      })
    })
  })
})

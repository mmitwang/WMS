/**
 * 严牌滤布卷材服务测试
 * 验证核心业务逻辑的正确性
 */

import { filterClothService } from '../services/filterClothService'

// 测试数据
const testClothData = {
  material: 'DL',
  width: 3000,
  length: 100.5,
  weight: 280.5,
  productionDate: '2026-01-07',
  batchNo: 'TEST001',
  supplier: '测试供应商',
  quantity: 1
}

/**
 * 测试卷材编码生成和唯一性验证
 */
export const testClothCodeGeneration = async () => {
  console.log('=== 测试卷材编码生成和唯一性验证 ===')
  
  try {
    // 测试正常录入
    const result1 = await filterClothService.create(testClothData)
    console.log('✓ 正常录入成功:', result1.data.code)
    
    // 测试重复编码录入
    try {
      await filterClothService.create(testClothData)
      console.log('✗ 重复编码验证失败 - 应该抛出异常')
    } catch (error) {
      if (error.message.includes('编码已存在')) {
        console.log('✓ 重复编码验证成功:', error.message)
      } else {
        console.log('✗ 重复编码验证失败 - 错误信息不正确:', error.message)
      }
    }
    
  } catch (error) {
    console.log('✗ 测试失败:', error.message)
  }
}

/**
 * 测试参数验证
 */
export const testParameterValidation = async () => {
  console.log('\n=== 测试参数验证 ===')
  
  // 测试宽幅验证
  try {
    await filterClothService.create({
      ...testClothData,
      width: 400, // 小于500mm
      batchNo: 'TEST002'
    })
    console.log('✗ 宽幅验证失败 - 应该抛出异常')
  } catch (error) {
    if (error.message.includes('宽幅不能小于500mm')) {
      console.log('✓ 宽幅验证成功:', error.message)
    } else {
      console.log('✗ 宽幅验证失败 - 错误信息不正确:', error.message)
    }
  }
  
  // 测试长度验证
  try {
    await filterClothService.create({
      ...testClothData,
      length: 5, // 小于10m
      batchNo: 'TEST003'
    })
    console.log('✗ 长度验证失败 - 应该抛出异常')
  } catch (error) {
    if (error.message.includes('长度不能小于10m')) {
      console.log('✓ 长度验证成功:', error.message)
    } else {
      console.log('✗ 长度验证失败 - 错误信息不正确:', error.message)
    }
  }
}

/**
 * 测试库位智能分配算法
 */
export const testLocationAllocation = async () => {
  console.log('\n=== 测试库位智能分配算法 ===')
  
  try {
    // 测试重型卷材分配
    const heavyClothLocation = await filterClothService.getRecommendedLocation({
      width: 3000,
      weight: 350, // 超过300kg
      material: 'DL'
    })
    console.log('✓ 重型卷材库位分配:', heavyClothLocation)
    
    if (heavyClothLocation.code.includes('05')) { // 重型货架编码包含05
      console.log('✓ 重型卷材正确分配到重型货架')
    } else {
      console.log('✗ 重型卷材分配错误 - 未分配到重型货架')
    }
    
    // 测试轻型卷材分配
    const lightClothLocation = await filterClothService.getRecommendedLocation({
      width: 1500,
      weight: 150, // 小于300kg
      material: 'PPS'
    })
    console.log('✓ 轻型卷材库位分配:', lightClothLocation)
    
    // 测试超宽卷材分配
    const wideClothLocation = await filterClothService.getRecommendedLocation({
      width: 5000, // 超过3000mm
      weight: 200,
      material: 'FL'
    })
    console.log('✓ 超宽卷材库位分配:', wideClothLocation)
    
  } catch (error) {
    console.log('✗ 库位分配测试失败:', error.message)
  }
}

/**
 * 测试入库流程和ERP同步
 */
export const testInboundProcess = async () => {
  console.log('\n=== 测试入库流程和ERP同步 ===')
  
  try {
    // 创建测试卷材
    const cloth = await filterClothService.create({
      ...testClothData,
      batchNo: 'INBOUND001'
    })
    console.log('✓ 创建测试卷材:', cloth.data.code)
    
    // 分配库位
    const location = await filterClothService.getRecommendedLocation({
      width: cloth.data.width,
      weight: cloth.data.weight,
      material: cloth.data.material
    })
    
    await filterClothService.assignLocation({
      clothId: cloth.data.id,
      locationCode: location.code
    })
    console.log('✓ 库位分配成功:', location.code)
    
    // 执行入库
    const inboundResult = await filterClothService.inbound([cloth.data.id])
    console.log('✓ 入库成功:', inboundResult.data.orderNo)
    
    if (inboundResult.warning) {
      console.log('⚠ ERP同步警告:', inboundResult.warning)
    } else {
      console.log('✓ ERP同步成功')
    }
    
  } catch (error) {
    console.log('✗ 入库流程测试失败:', error.message)
  }
}

/**
 * 测试查询和筛选功能
 */
export const testQueryAndFilter = async () => {
  console.log('\n=== 测试查询和筛选功能 ===')
  
  try {
    // 测试全量查询
    const allCloths = await filterClothService.getList()
    console.log('✓ 全量查询成功，总数:', allCloths.total)
    
    // 测试材质筛选
    const dlCloths = await filterClothService.getList({ material: 'DL' })
    console.log('✓ 涤纶材质筛选成功，数量:', dlCloths.total)
    
    // 测试状态筛选
    const pendingCloths = await filterClothService.getList({ status: 'pending' })
    console.log('✓ 待入库状态筛选成功，数量:', pendingCloths.total)
    
    // 测试编码搜索
    const searchResult = await filterClothService.getList({ code: 'YP-DL' })
    console.log('✓ 编码搜索成功，数量:', searchResult.total)
    
  } catch (error) {
    console.log('✗ 查询筛选测试失败:', error.message)
  }
}

/**
 * 运行所有测试
 */
export const runAllTests = async () => {
  console.log('开始执行严牌滤布卷材服务测试...\n')
  
  await testClothCodeGeneration()
  await testParameterValidation()
  await testLocationAllocation()
  await testInboundProcess()
  await testQueryAndFilter()
  
  console.log('\n=== 测试完成 ===')
  console.log('请检查上述测试结果，确保所有核心功能正常工作')
}

// 如果直接运行此文件，执行所有测试
if (typeof window !== 'undefined') {
  // 浏览器环境，可以在控制台手动调用
  window.filterClothTests = {
    runAllTests,
    testClothCodeGeneration,
    testParameterValidation,
    testLocationAllocation,
    testInboundProcess,
    testQueryAndFilter
  }
  
  console.log('滤布卷材测试已加载，可在控制台调用:')
  console.log('- filterClothTests.runAllTests() // 运行所有测试')
  console.log('- filterClothTests.testClothCodeGeneration() // 测试编码生成')
  console.log('- filterClothTests.testLocationAllocation() // 测试库位分配')
}

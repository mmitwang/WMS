import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 侧边栏状态
  const sidebarCollapsed = ref(false)
  
  // 当前路由
  const currentRoute = ref('dashboard')
  
  // 用户信息
  const userInfo = ref({
    name: '管理员',
    role: 'admin',
    avatar: '',
    permissions: ['all']
  })
  
  // 系统设置
  const systemSettings = ref({
    theme: 'cyber-industrial',
    language: 'zh-CN',
    autoSave: true,
    notifications: true
  })
  
  // 实时数据
  const realTimeData = ref({
    totalInventory: 15420,
    todayInbound: 156,
    todayOutbound: 89,
    alertCount: 3,
    warehouseUtilization: 78.5,
    lastUpdateTime: new Date().toLocaleString()
  })
  
  // 计算属性
  const sidebarWidth = computed(() => {
    return sidebarCollapsed.value ? '64px' : '240px'
  })
  
  const hasPermission = computed(() => {
    return (permission) => {
      return userInfo.value.permissions.includes('all') || 
             userInfo.value.permissions.includes(permission)
    }
  })
  
  // 方法
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  const setCurrentRoute = (route) => {
    currentRoute.value = route
  }
  
  const updateUserInfo = (info) => {
    userInfo.value = { ...userInfo.value, ...info }
  }
  
  const updateSystemSettings = (settings) => {
    systemSettings.value = { ...systemSettings.value, ...settings }
  }
  
  const updateRealTimeData = (data) => {
    realTimeData.value = { ...realTimeData.value, ...data }
    realTimeData.value.lastUpdateTime = new Date().toLocaleString()
  }
  
  // 模拟实时数据更新
  const startRealTimeUpdate = () => {
    setInterval(() => {
      const randomChange = () => Math.floor(Math.random() * 10) - 5
      
      updateRealTimeData({
        totalInventory: Math.max(0, realTimeData.value.totalInventory + randomChange()),
        todayInbound: Math.max(0, realTimeData.value.todayInbound + Math.floor(Math.random() * 3)),
        todayOutbound: Math.max(0, realTimeData.value.todayOutbound + Math.floor(Math.random() * 2)),
        alertCount: Math.max(0, Math.min(10, realTimeData.value.alertCount + (Math.random() > 0.8 ? 1 : 0))),
        warehouseUtilization: Math.max(0, Math.min(100, realTimeData.value.warehouseUtilization + (Math.random() - 0.5) * 2))
      })
    }, 5000) // 每5秒更新一次
  }
  
  return {
    // 状态
    sidebarCollapsed,
    currentRoute,
    userInfo,
    systemSettings,
    realTimeData,
    
    // 计算属性
    sidebarWidth,
    hasPermission,
    
    // 方法
    toggleSidebar,
    setCurrentRoute,
    updateUserInfo,
    updateSystemSettings,
    updateRealTimeData,
    startRealTimeUpdate
  }
})

<template>
  <div id="app" class="cyber-app">
    <!-- 粒子背景 -->
    <canvas ref="particleCanvas" class="particles-container"></canvas>
    
    <!-- 侧边栏 -->
    <aside 
      class="sidebar" 
      :class="{ collapsed: appStore.sidebarCollapsed }"
      :style="{ width: appStore.sidebarWidth }"
    >
      <!-- Logo区域 -->
      <div class="sidebar-header">
        <div class="logo">
          <el-icon class="logo-icon"><DataAnalysis /></el-icon>
          <span v-show="!appStore.sidebarCollapsed" class="logo-text">WMS系统</span>
        </div>
        <el-button 
          class="collapse-btn"
          @click="appStore.toggleSidebar"
          :icon="appStore.sidebarCollapsed ? 'Expand' : 'Fold'"
          circle
          size="small"
        />
      </div>
      
      <!-- 导航菜单 -->
      <nav class="sidebar-nav">
        <el-menu
          :default-active="$route.name"
          class="cyber-menu"
          :collapse="appStore.sidebarCollapsed"
          :collapse-transition="false"
          router
        >
          <el-menu-item 
            v-for="route in menuRoutes" 
            :key="route.name"
            :index="route.name"
            :route="route.path"
            class="cyber-menu-item"
          >
            <el-icon><component :is="route.meta.icon" /></el-icon>
            <template #title>{{ route.meta.title }}</template>
          </el-menu-item>
        </el-menu>
      </nav>
      
      <!-- 用户信息 -->
      <div class="sidebar-footer" v-show="!appStore.sidebarCollapsed">
        <div class="user-info">
          <el-avatar :size="32" class="user-avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="user-details">
            <div class="user-name">{{ appStore.userInfo.name }}</div>
            <div class="user-role">{{ appStore.userInfo.role }}</div>
          </div>
        </div>
      </div>
    </aside>
    
    <!-- 主内容区域 -->
    <main class="main-content" :style="{ marginLeft: appStore.sidebarWidth }">
      <!-- 顶部导航栏 -->
      <header class="main-header">
        <div class="header-left">
          <h1 class="page-title">{{ currentPageTitle }}</h1>
        </div>
        <div class="header-right">
          <!-- 实时数据指示器 -->
          <div class="realtime-indicators">
            <div class="indicator">
              <el-icon class="indicator-icon"><Box /></el-icon>
              <span class="indicator-value">{{ appStore.realTimeData.totalInventory }}</span>
              <span class="indicator-label">总库存</span>
            </div>
            <div class="indicator">
              <el-icon class="indicator-icon"><Download /></el-icon>
              <span class="indicator-value">{{ appStore.realTimeData.todayInbound }}</span>
              <span class="indicator-label">今日入库</span>
            </div>
            <div class="indicator">
              <el-icon class="indicator-icon"><Upload /></el-icon>
              <span class="indicator-value">{{ appStore.realTimeData.todayOutbound }}</span>
              <span class="indicator-label">今日出库</span>
            </div>
            <div class="indicator alert" v-if="appStore.realTimeData.alertCount > 0">
              <el-icon class="indicator-icon"><Warning /></el-icon>
              <span class="indicator-value">{{ appStore.realTimeData.alertCount }}</span>
              <span class="indicator-label">告警</span>
            </div>
          </div>
          
          <!-- 系统时间 -->
          <div class="system-time">
            <el-icon><Clock /></el-icon>
            <span>{{ currentTime }}</span>
          </div>
        </div>
      </header>
      
      <!-- 页面内容 -->
      <div class="page-content">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from './stores/app'
import { createParticleBackground } from './utils/particles'

const route = useRoute()
const appStore = useAppStore()
const particleCanvas = ref(null)

// 当前时间
const currentTime = ref(new Date().toLocaleString())
let timeInterval = null

// 粒子系统实例
let particleSystem = null

// 菜单路由
const menuRoutes = computed(() => {
  return [
    { name: 'Dashboard', path: '/dashboard', meta: { title: '数据仪表盘', icon: 'DataAnalysis' } },
    { name: 'WarehouseManagement', path: '/warehouse', meta: { title: '库区管理', icon: 'House' } },
    { name: 'InventoryMonitoring', path: '/inventory', meta: { title: '库存监控', icon: 'Monitor' } },
    { name: 'FilterClothManagement', path: '/filter-cloth', meta: { title: '严牌滤布卷材', icon: 'Grid' } },
    { name: 'ClothCuttingManagement', path: '/cloth-cutting', meta: { title: '卷材裁剪管理', icon: 'ScaleToOriginal' } },
    { name: 'EnvironmentMonitoring', path: '/environment-monitoring', meta: { title: '环境监控', icon: 'Sunny' } },
    { name: 'OutboundPickingManagement', path: '/outbound-picking', meta: { title: '出库拣选管理', icon: 'Operation' } },
    { name: 'InventoryVisualizationManagement', path: '/inventory-visualization', meta: { title: '库存可视化管理', icon: 'DataBoard' } },
    { name: 'InboundManagement', path: '/inbound', meta: { title: '入库管理', icon: 'Download' } },
    { name: 'OutboundManagement', path: '/outbound', meta: { title: '出库管理', icon: 'Upload' } },
    { name: 'StockTransfer', path: '/transfer', meta: { title: '库存调拨', icon: 'Switch' } },
    { name: 'InventoryCount', path: '/count', meta: { title: '盘点管理', icon: 'DocumentChecked' } },
    { name: 'ReportAnalysis', path: '/report', meta: { title: '报表分析', icon: 'PieChart' } },
    { name: 'SystemSettings', path: '/settings', meta: { title: '系统设置', icon: 'Setting' } }
  ]
})

// 当前页面标题
const currentPageTitle = computed(() => {
  const currentRoute = menuRoutes.value.find(r => r.name === route.name)
  return currentRoute ? currentRoute.meta.title : '仓储管理系统'
})

onMounted(async () => {
  // 初始化粒子背景
  if (particleCanvas.value) {
    const { ParticleSystem } = await import('./utils/particles')
    particleSystem = new ParticleSystem(particleCanvas.value, {
      particleCount: 30,
      particleSize: 1.5,
      particleSpeed: 0.3,
      connectionDistance: 120,
      connectionOpacity: 0.2
    })
    particleSystem.addMouseInteraction()
  }
  
  // 启动实时数据更新
  appStore.startRealTimeUpdate()
  
  // 启动时间更新
  timeInterval = setInterval(() => {
    currentTime.value = new Date().toLocaleString()
  }, 1000)
})

onUnmounted(() => {
  // 清理粒子系统
  if (particleSystem) {
    particleSystem.destroy()
  }
  
  // 清理时间定时器
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style lang="scss" scoped>
@import './styles/variables.scss';

.cyber-app {
  height: 100vh;
  display: flex;
  background: var(--gradient-bg);
  position: relative;
  overflow: hidden;
}

.particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  opacity: 0.3;
}

// 侧边栏样式
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  background: var(--gradient-card);
  backdrop-filter: blur(10px);
  border-right: 1px solid var(--border-primary);
  transition: width var(--transition-normal) ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  
  &.collapsed {
    .sidebar-header .logo-text {
      opacity: 0;
    }
  }
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .logo {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    
    .logo-icon {
      font-size: 24px;
      color: var(--cyber-blue);
      @include cyber-glow;
    }
    
    .logo-text {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      transition: opacity var(--transition-normal) ease;
    }
  }
  
  .collapse-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border-primary);
    color: var(--cyber-blue);
    
    &:hover {
      @include cyber-glow;
    }
  }
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md) 0;
  
  :deep(.cyber-menu) {
    background: transparent;
    border: none;
    
    .el-menu-item {
      color: var(--text-secondary);
      border-radius: var(--border-radius);
      margin: 4px var(--spacing-sm);
      transition: all var(--transition-normal) ease;
      position: relative;
      
      &:hover {
        background: rgba(0, 255, 255, 0.1);
        color: var(--cyber-blue);
        @include cyber-glow;
      }
      
      &.is-active {
        background: var(--gradient-cyber);
        color: var(--text-primary);
        @include cyber-glow;
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--industrial-red);
          border-radius: 0 2px 2px 0;
        }
      }
      
      .el-icon {
        font-size: 18px;
      }
    }
  }
}

.sidebar-footer {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--border-secondary);
  
  .user-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    
    .user-avatar {
      background: var(--gradient-cyber);
      color: var(--text-primary);
    }
    
    .user-details {
      .user-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .user-role {
        font-size: 12px;
        color: var(--text-muted);
      }
    }
  }
}

// 主内容区域
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left var(--transition-normal) ease;
}

.main-header {
  height: 64px;
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  position: sticky;
  top: 0;
  z-index: 100;
  
  .header-left {
    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      text-shadow: 0 0 10px var(--cyber-blue-glow);
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }
}

.realtime-indicators {
  display: flex;
  gap: var(--spacing-md);
  
  .indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--spacing-sm);
    background: var(--bg-glass);
    border: 1px solid var(--border-secondary);
    border-radius: var(--border-radius);
    min-width: 60px;
    transition: all var(--transition-normal) ease;
    
    &:hover {
      @include cyber-glow;
      transform: translateY(-2px);
    }
    
    &.alert {
      border-color: var(--industrial-red);
      background: rgba(255, 51, 0, 0.1);
      
      .indicator-icon {
        color: var(--industrial-red);
        animation: pulse 2s ease-in-out infinite;
      }
    }
    
    .indicator-icon {
      font-size: 16px;
      color: var(--cyber-blue);
      margin-bottom: 2px;
    }
    
    .indicator-value {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1;
    }
    
    .indicator-label {
      font-size: 10px;
      color: var(--text-muted);
      line-height: 1;
      margin-top: 2px;
    }
  }
}

.system-time {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-secondary);
  font-size: 14px;
  font-family: 'Courier New', monospace;
  
  .el-icon {
    color: var(--cyber-blue);
  }
}

.page-content {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
  position: relative;
}

// 页面切换动画
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all var(--transition-normal) ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

// 响应式设计
@include respond-to(md) {
  .realtime-indicators {
    .indicator {
      min-width: 80px;
      
      .indicator-value {
        font-size: 16px;
      }
      
      .indicator-label {
        font-size: 12px;
      }
    }
  }
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    
    &:not(.collapsed) {
      transform: translateX(0);
    }
  }
  
  .main-content {
    margin-left: 0 !important;
  }
  
  .realtime-indicators {
    display: none;
  }
  
  .main-header {
    padding: 0 var(--spacing-md);
    
    .page-title {
      font-size: 18px;
    }
  }
}
</style>

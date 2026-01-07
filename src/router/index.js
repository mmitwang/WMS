import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: '数据仪表盘', icon: 'DataAnalysis' }
  },
  {
    path: '/warehouse',
    name: 'WarehouseManagement',
    component: () => import('../views/WarehouseManagement.vue'),
    meta: { title: '库区管理', icon: 'House' }
  },
  {
    path: '/inventory',
    name: 'InventoryMonitoring',
    component: () => import('../views/InventoryMonitoring.vue'),
    meta: { title: '库存监控', icon: 'Monitor' }
  },
  {
    path: '/filter-cloth',
    name: 'FilterClothManagement',
    component: () => import('../views/FilterClothManagement.vue'),
    meta: { title: '严牌滤布卷材', icon: 'Grid' }
  },
  {
    path: '/cloth-cutting',
    name: 'ClothCuttingManagement',
    component: () => import('../views/ClothCuttingManagement.vue'),
    meta: { title: '卷材裁剪管理', icon: 'ScaleToOriginal' }
  },
  {
    path: '/environment-monitoring',
    name: 'EnvironmentMonitoring',
    component: () => import('../views/EnvironmentMonitoring.vue'),
    meta: { title: '环境监控', icon: 'Sunny' }
  },
  {
    path: '/outbound-picking',
    name: 'OutboundPickingManagement',
    component: () => import('../views/OutboundPickingManagement.vue'),
    meta: { title: '出库拣选管理', icon: 'Operation' }
  },
  {
    path: '/inbound',
    name: 'InboundManagement',
    component: () => import('../views/InboundManagement.vue'),
    meta: { title: '入库管理', icon: 'Download' }
  },
  {
    path: '/outbound',
    name: 'OutboundManagement',
    component: () => import('../views/OutboundManagement.vue'),
    meta: { title: '出库管理', icon: 'Upload' }
  },
  {
    path: '/transfer',
    name: 'StockTransfer',
    component: () => import('../views/StockTransfer.vue'),
    meta: { title: '库存调拨', icon: 'Switch' }
  },
  {
    path: '/count',
    name: 'InventoryCount',
    component: () => import('../views/InventoryCount.vue'),
    meta: { title: '盘点管理', icon: 'DocumentChecked' }
  },
  {
    path: '/inventory-visualization',
    name: 'InventoryVisualizationManagement',
    component: () => import('../views/InventoryVisualizationManagement.vue'),
    meta: { title: '库存可视化管理', icon: 'DataBoard' }
  },
  {
    path: '/electrical-components',
    name: 'ElectricalComponentManagement',
    component: () => import('../views/ElectricalComponentManagement.vue'),
    meta: { title: '腾腾电气元器件', icon: 'Lightning' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

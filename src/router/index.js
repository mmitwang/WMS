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
    meta: { title: '腾腾电气仪表盘', icon: 'DataAnalysis' }
  },
  {
    path: '/electrical-components',
    name: 'ElectricalComponentManagement',
    component: () => import('../views/ElectricalComponentManagement.vue'),
    meta: { title: '电气元器件管理', icon: 'Lightning' }
  },
  {
    path: '/electrical-warehouse',
    name: 'ElectricalWarehouseManagement',
    component: () => import('../views/ElectricalWarehouseManagement.vue'),
    meta: { title: '电气仓储管理', icon: 'House' }
  },
  {
    path: '/electrical-inventory',
    name: 'ElectricalInventoryMonitoring',
    component: () => import('../views/ElectricalInventoryMonitoring.vue'),
    meta: { title: '电气库存监控', icon: 'Monitor' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

<template>
  <div class="warehouse-management">
    <div class="page-header">
      <h2>库区管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新增库区
      </el-button>
    </div>

    <div class="warehouse-grid">
      <div 
        v-for="warehouse in warehouses" 
        :key="warehouse.id"
        class="warehouse-card"
        :class="{ active: warehouse.status === 'active' }"
      >
        <div class="warehouse-header">
          <div class="warehouse-name">{{ warehouse.name }}</div>
          <div class="warehouse-status" :class="warehouse.status">
            {{ warehouse.statusText }}
          </div>
        </div>
        
        <div class="warehouse-stats">
          <div class="stat-item">
            <span class="stat-label">容量</span>
            <span class="stat-value">{{ warehouse.capacity }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已用</span>
            <span class="stat-value">{{ warehouse.used }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">利用率</span>
            <span class="stat-value">{{ warehouse.utilization }}%</span>
          </div>
        </div>

        <div class="warehouse-progress">
          <el-progress 
            :percentage="warehouse.utilization" 
            :color="getProgressColor(warehouse.utilization)"
            :show-text="false"
          />
        </div>

        <div class="warehouse-actions">
          <el-button size="small" @click="editWarehouse(warehouse)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteWarehouse(warehouse.id)">删除</el-button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="showAddDialog" title="库区信息" width="500px">
      <el-form :model="warehouseForm" label-width="80px">
        <el-form-item label="库区名称">
          <el-input v-model="warehouseForm.name" />
        </el-form-item>
        <el-form-item label="容量">
          <el-input-number v-model="warehouseForm.capacity" :min="1" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="warehouseForm.status">
            <el-option label="活跃" value="active" />
            <el-option label="维护" value="maintenance" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveWarehouse">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showAddDialog = ref(false)
const warehouseForm = ref({
  name: '',
  capacity: 1000,
  status: 'active'
})

const warehouses = ref([
  {
    id: 1,
    name: 'A区仓库',
    capacity: 1000,
    used: 780,
    utilization: 78,
    status: 'active',
    statusText: '活跃'
  },
  {
    id: 2,
    name: 'B区仓库',
    capacity: 1200,
    used: 960,
    utilization: 80,
    status: 'active',
    statusText: '活跃'
  },
  {
    id: 3,
    name: 'C区仓库',
    capacity: 800,
    used: 320,
    utilization: 40,
    status: 'maintenance',
    statusText: '维护中'
  }
])

const getProgressColor = (percentage) => {
  if (percentage < 50) return '#00FF88'
  if (percentage < 80) return '#FF7A45'
  return '#FF3300'
}

const editWarehouse = (warehouse) => {
  warehouseForm.value = { ...warehouse }
  showAddDialog.value = true
}

const deleteWarehouse = (id) => {
  warehouses.value = warehouses.value.filter(w => w.id !== id)
}

const saveWarehouse = () => {
  // 保存逻辑
  showAddDialog.value = false
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';

.warehouse-management {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);

    h2 {
      color: var(--text-primary);
      margin: 0;
    }
  }

  .warehouse-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--spacing-lg);
  }

  .warehouse-card {
    @include glass-effect;
    padding: var(--spacing-lg);
    border-radius: var(--border-radius-large);
    transition: all var(--transition-normal) ease;

    &:hover {
      @include cyber-glow;
      transform: translateY(-4px);
    }

    &.active {
      border-color: var(--cyber-blue);
    }

    .warehouse-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-md);

      .warehouse-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .warehouse-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;

        &.active {
          background: rgba(0, 255, 136, 0.2);
          color: var(--text-success);
        }

        &.maintenance {
          background: rgba(255, 122, 69, 0.2);
          color: var(--text-warning);
        }

        &.inactive {
          background: rgba(255, 51, 0, 0.2);
          color: var(--text-danger);
        }
      }
    }

    .warehouse-stats {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);

      .stat-item {
        text-align: center;

        .stat-label {
          display: block;
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
      }
    }

    .warehouse-progress {
      margin-bottom: var(--spacing-md);
    }

    .warehouse-actions {
      display: flex;
      gap: var(--spacing-sm);
      justify-content: flex-end;
    }
  }
}
</style>

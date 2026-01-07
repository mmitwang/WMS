<template>
  <div class="inventory-monitoring">
    <div class="page-header">
      <h2>库存监控</h2>
      <div class="header-actions">
        <el-input 
          v-model="searchText" 
          placeholder="搜索商品..." 
          style="width: 200px;"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="monitoring-cards">
      <div class="card-item">
        <div class="card-icon">
          <el-icon><Box /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">15,420</div>
          <div class="card-label">总库存</div>
        </div>
      </div>
      <div class="card-item warning">
        <div class="card-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">23</div>
          <div class="card-label">低库存预警</div>
        </div>
      </div>
      <div class="card-item danger">
        <div class="card-icon">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="card-content">
          <div class="card-value">5</div>
          <div class="card-label">缺货商品</div>
        </div>
      </div>
    </div>

    <div class="inventory-table">
      <el-table 
        :data="filteredInventory" 
        class="cyber-table"
        stripe
        height="600"
      >
        <el-table-column prop="sku" label="SKU" width="120" />
        <el-table-column prop="name" label="商品名称" min-width="200" />
        <el-table-column prop="category" label="分类" width="120" />
        <el-table-column prop="warehouse" label="库区" width="100" />
        <el-table-column prop="quantity" label="库存数量" width="120" align="right">
          <template #default="{ row }">
            <span :class="getQuantityClass(row.quantity, row.minStock)">
              {{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="最低库存" width="120" align="right" />
        <el-table-column prop="maxStock" label="最高库存" width="120" align="right" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.quantity, row.minStock)"
              size="small"
            >
              {{ getStatusText(row.quantity, row.minStock) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdate" label="最后更新" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetails(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchText = ref('')

const inventory = ref([
  {
    id: 1,
    sku: 'SKU001',
    name: '电子产品A',
    category: '电子',
    warehouse: 'A区',
    quantity: 150,
    minStock: 50,
    maxStock: 500,
    lastUpdate: '2024-01-07 10:30'
  },
  {
    id: 2,
    sku: 'SKU002',
    name: '服装产品B',
    category: '服装',
    warehouse: 'B区',
    quantity: 25,
    minStock: 30,
    maxStock: 200,
    lastUpdate: '2024-01-07 09:15'
  },
  {
    id: 3,
    sku: 'SKU003',
    name: '食品产品C',
    category: '食品',
    warehouse: 'C区',
    quantity: 0,
    minStock: 20,
    maxStock: 100,
    lastUpdate: '2024-01-06 16:45'
  }
])

const filteredInventory = computed(() => {
  if (!searchText.value) return inventory.value
  return inventory.value.filter(item => 
    item.name.includes(searchText.value) || 
    item.sku.includes(searchText.value)
  )
})

const getQuantityClass = (quantity, minStock) => {
  if (quantity === 0) return 'text-danger'
  if (quantity <= minStock) return 'text-warning'
  return 'text-success'
}

const getStatusType = (quantity, minStock) => {
  if (quantity === 0) return 'danger'
  if (quantity <= minStock) return 'warning'
  return 'success'
}

const getStatusText = (quantity, minStock) => {
  if (quantity === 0) return '缺货'
  if (quantity <= minStock) return '低库存'
  return '正常'
}

const viewDetails = (row) => {
  console.log('查看详情:', row)
}
</script>

<style lang="scss" scoped>
.inventory-monitoring {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-xl);

    h2 {
      color: var(--text-primary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-md);
      align-items: center;
    }
  }

  .monitoring-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: var(--spacing-lg);
    margin-bottom: var(--spacing-xl);

    .card-item {
      @include glass-effect;
      padding: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      transition: all var(--transition-normal) ease;

      &:hover {
        @include cyber-glow;
        transform: translateY(-2px);
      }

      &.warning {
        border-color: var(--text-warning);
        
        .card-icon {
          color: var(--text-warning);
        }
      }

      &.danger {
        border-color: var(--text-danger);
        
        .card-icon {
          color: var(--text-danger);
        }
      }

      .card-icon {
        font-size: 32px;
        color: var(--cyber-blue);
      }

      .card-content {
        .card-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .card-label {
          font-size: 14px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
      }
    }
  }

  .inventory-table {
    @include glass-effect;
    padding: var(--spacing-lg);
    border-radius: var(--border-radius-large);

    :deep(.cyber-table) {
      background: transparent;

      .el-table__header {
        background: var(--bg-secondary);
        
        th {
          background: transparent;
          color: var(--text-cyber);
          border-bottom: 1px solid var(--border-primary);
        }
      }

      .el-table__body {
        tr {
          background: transparent;
          
          &:hover {
            background: rgba(0, 255, 255, 0.05) !important;
          }

          td {
            border-bottom: 1px solid var(--border-secondary);
            color: var(--text-primary);
          }
        }

        .el-table__row--striped {
          background: rgba(255, 255, 255, 0.02);
        }
      }
    }
  }
}
</style>

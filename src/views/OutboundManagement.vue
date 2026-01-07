<template>
  <div class="outbound-management">
    <div class="page-header">
      <h2>出库管理</h2>
      <el-button type="primary">
        <el-icon><Plus /></el-icon>
        新建出库单
      </el-button>
    </div>

    <div class="outbound-table">
      <el-table :data="outboundList" class="cyber-table" stripe>
        <el-table-column prop="orderNo" label="出库单号" width="150" />
        <el-table-column prop="customer" label="客户" width="120" />
        <el-table-column prop="items" label="商品数量" width="100" />
        <el-table-column prop="totalQuantity" label="总数量" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small">详情</el-button>
            <el-button size="small" type="primary" v-if="row.status === 'pending'">
              开始出库
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const outboundList = ref([
  {
    id: 1,
    orderNo: 'OUT202401070001',
    customer: '客户A',
    items: 3,
    totalQuantity: 50,
    status: 'pending',
    createTime: '2024-01-07 09:00'
  },
  {
    id: 2,
    orderNo: 'OUT202401070002',
    customer: '客户B',
    items: 2,
    totalQuantity: 30,
    status: 'completed',
    createTime: '2024-01-07 08:30'
  }
])

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待出库',
    processing: '出库中',
    completed: '已完成'
  }
  return texts[status] || '未知'
}
</script>

<style lang="scss" scoped>
@import '../styles/variables.scss';

.outbound-management {
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

  .outbound-table {
    @include glass-effect;
    padding: var(--spacing-lg);

    :deep(.cyber-table) {
      background: transparent;

      .el-table__header th {
        background: var(--bg-secondary);
        color: var(--text-cyber);
        border-bottom: 1px solid var(--border-primary);
      }

      .el-table__body tr {
        background: transparent;
        
        &:hover {
          background: rgba(0, 255, 255, 0.05) !important;
        }

        td {
          border-bottom: 1px solid var(--border-secondary);
          color: var(--text-primary);
        }
      }
    }
  }
}
</style>

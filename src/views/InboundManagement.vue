<template>
  <div class="inbound-management">
    <div class="page-header">
      <h2>入库管理</h2>
      <el-button type="primary">
        <el-icon><Plus /></el-icon>
        新建入库单
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true">
        <el-form-item label="状态">
          <el-select v-model="filterStatus" placeholder="全部状态">
            <el-option label="全部" value="" />
            <el-option label="待入库" value="pending" />
            <el-option label="入库中" value="processing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="inbound-table">
      <el-table :data="inboundList" class="cyber-table" stripe>
        <el-table-column prop="orderNo" label="入库单号" width="150" />
        <el-table-column prop="supplier" label="供应商" width="120" />
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
              开始入库
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const filterStatus = ref('')

const inboundList = ref([
  {
    id: 1,
    orderNo: 'IN202401070001',
    supplier: '供应商A',
    items: 5,
    totalQuantity: 100,
    status: 'pending',
    createTime: '2024-01-07 09:00'
  },
  {
    id: 2,
    orderNo: 'IN202401070002',
    supplier: '供应商B',
    items: 3,
    totalQuantity: 50,
    status: 'processing',
    createTime: '2024-01-07 10:30'
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
    pending: '待入库',
    processing: '入库中',
    completed: '已完成'
  }
  return texts[status] || '未知'
}
</script>

<style lang="scss" scoped>
.inbound-management {
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

  .filter-bar {
    @include glass-effect;
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  }

  .inbound-table {
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

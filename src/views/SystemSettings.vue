<template>
  <div class="system-settings">
    <div class="page-header">
      <h2>系统设置</h2>
    </div>

    <div class="settings-content">
      <div class="settings-card">
        <h3>基本设置</h3>
        <el-form :model="settings" label-width="120px">
          <el-form-item label="系统名称">
            <el-input v-model="settings.systemName" />
          </el-form-item>
          <el-form-item label="主题风格">
            <el-select v-model="settings.theme">
              <el-option label="赛博工业风" value="cyber-industrial" />
              <el-option label="经典蓝色" value="classic-blue" />
            </el-select>
          </el-form-item>
          <el-form-item label="语言">
            <el-select v-model="settings.language">
              <el-option label="中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
            </el-select>
          </el-form-item>
          <el-form-item label="自动保存">
            <el-switch v-model="settings.autoSave" />
          </el-form-item>
          <el-form-item label="消息通知">
            <el-switch v-model="settings.notifications" />
          </el-form-item>
        </el-form>
      </div>

      <div class="settings-card">
        <h3>仓库设置</h3>
        <el-form label-width="120px">
          <el-form-item label="默认库区">
            <el-select v-model="settings.defaultWarehouse">
              <el-option label="A区仓库" value="warehouse-a" />
              <el-option label="B区仓库" value="warehouse-b" />
            </el-select>
          </el-form-item>
          <el-form-item label="库存预警阈值">
            <el-input-number v-model="settings.stockThreshold" :min="0" />
          </el-form-item>
        </el-form>
      </div>

      <div class="settings-actions">
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
        <el-button @click="resetSettings">重置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const settings = ref({
  systemName: 'WMS仓储管理系统',
  theme: 'cyber-industrial',
  language: 'zh-CN',
  autoSave: true,
  notifications: true,
  defaultWarehouse: 'warehouse-a',
  stockThreshold: 50
})

const saveSettings = () => {
  console.log('保存设置:', settings.value)
}

const resetSettings = () => {
  console.log('重置设置')
}
</script>

<style lang="scss" scoped>
.system-settings {
  .page-header {
    margin-bottom: var(--spacing-xl);

    h2 {
      color: var(--text-primary);
      margin: 0;
    }
  }

  .settings-content {
    display: grid;
    gap: var(--spacing-lg);
  }

  .settings-card {
    @include glass-effect;
    padding: var(--spacing-lg);

    h3 {
      color: var(--text-primary);
      margin: 0 0 var(--spacing-lg) 0;
      font-size: 18px;
    }
  }

  .settings-actions {
    display: flex;
    gap: var(--spacing-md);
    justify-content: center;
    margin-top: var(--spacing-xl);
  }
}
</style>

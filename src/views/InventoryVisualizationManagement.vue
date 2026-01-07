<template>
  <div class="inventory-visualization-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>库存可视化与通用管理</h1>
      <p>3D库存展示、报表分析、系统管理</p>
    </div>

    <!-- 功能选项卡 -->
    <el-tabs v-model="activeTab" class="management-tabs">
      <!-- 3D库存可视化 -->
      <el-tab-pane label="3D库存可视化" name="visualization">
        <div class="visualization-section">
          <!-- 控制面板 -->
          <div class="control-panel">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-select v-model="visualizationParams.warehouseId" placeholder="选择仓库" @change="load3DData">
                  <el-option
                    v-for="warehouse in warehouses"
                    :key="warehouse.id"
                    :label="warehouse.name"
                    :value="warehouse.id"
                  />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="visualizationParams.areaId" placeholder="选择区域" clearable @change="load3DData">
                  <el-option
                    v-for="area in areas"
                    :key="area.id"
                    :label="area.name"
                    :value="area.id"
                  />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-select v-model="visualizationParams.materialType" placeholder="材质类型" clearable @change="load3DData">
                  <el-option label="针刺毡" value="ZCM" />
                  <el-option label="机织滤布" value="JZ" />
                  <el-option label="过滤网带" value="WD" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-button type="primary" @click="load3DData" :loading="loading3D">
                  <el-icon><Refresh /></el-icon>
                  刷新数据
                </el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 3D可视化容器 -->
          <div class="visualization-container">
            <div class="visualization-main">
              <div ref="visualization3D" class="visualization-canvas" v-loading="loading3D">
                <!-- 3D可视化画布 -->
                <div v-if="!visualization3DData.warehouse" class="empty-state">
                  <el-icon size="64"><Box /></el-icon>
                  <p>请选择仓库查看3D可视化</p>
                </div>
                <div v-else class="warehouse-3d">
                  <!-- 简化的3D展示 -->
                  <div class="warehouse-layout">
                    <div class="warehouse-info">
                      <h3>{{ visualization3DData.warehouse.name }}</h3>
                      <p>利用率: {{ visualization3DData.statistics.utilizationRate }}%</p>
                    </div>
                    <div class="areas-grid">
                      <div
                        v-for="area in visualization3DData.warehouse.areas"
                        :key="area.id"
                        class="area-block"
                        :style="{ backgroundColor: getAreaColor(area.utilization) }"
                        @click="selectArea(area)"
                      >
                        <div class="area-name">{{ area.name }}</div>
                        <div class="area-utilization">{{ area.utilization }}%</div>
                        <div class="area-items">{{ area.items.length }}件</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 统计信息面板 -->
            <div class="statistics-panel">
              <el-card>
                <template #header>
                  <span>库存统计</span>
                </template>
                <div class="statistics-grid">
                  <div class="stat-item">
                    <div class="stat-value">{{ visualization3DData.statistics?.totalCapacity || 0 }}</div>
                    <div class="stat-label">总容量</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ visualization3DData.statistics?.usedCapacity || 0 }}</div>
                    <div class="stat-label">已用容量</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ visualization3DData.statistics?.itemCount || 0 }}</div>
                    <div class="stat-label">物品数量</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value">{{ visualization3DData.statistics?.areaCount || 0 }}</div>
                    <div class="stat-label">存储区域</div>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 库存报表分析 -->
      <el-tab-pane label="库存报表分析" name="reports">
        <div class="reports-section">
          <!-- 报表控制面板 -->
          <div class="report-controls">
            <el-row :gutter="20">
              <el-col :span="4">
                <el-select v-model="reportParams.reportType" placeholder="报表类型" @change="loadReportData">
                  <el-option label="汇总报表" value="summary" />
                  <el-option label="详细报表" value="detail" />
                  <el-option label="趋势分析" value="trend" />
                  <el-option label="深度分析" value="analysis" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-date-picker
                  v-model="reportDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  @change="handleDateRangeChange"
                />
              </el-col>
              <el-col :span="4">
                <el-select v-model="reportParams.materialType" placeholder="材质类型" clearable @change="loadReportData">
                  <el-option label="针刺毡" value="ZCM" />
                  <el-option label="机织滤布" value="JZ" />
                  <el-option label="过滤网带" value="WD" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-button type="primary" @click="loadReportData" :loading="loadingReport">
                  <el-icon><Search /></el-icon>
                  生成报表
                </el-button>
                <el-button @click="exportReport" :loading="exportingReport">
                  <el-icon><Download /></el-icon>
                  导出报表
                </el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 报表内容 -->
          <div class="report-content" v-loading="loadingReport">
            <!-- 汇总报表 -->
            <div v-if="reportParams.reportType === 'summary'" class="summary-report">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card>
                    <template #header>
                      <span>库存价值分析</span>
                    </template>
                    <div class="value-analysis">
                      <div class="total-value">
                        <span class="label">总价值:</span>
                        <span class="value">{{ formatCurrency(reportData.data?.totalValue || 0) }}</span>
                      </div>
                      <div class="total-quantity">
                        <span class="label">总数量:</span>
                        <span class="value">{{ reportData.data?.totalQuantity || 0 }} 卷</span>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card>
                    <template #header>
                      <span>分类占比</span>
                    </template>
                    <div ref="categoryChart" class="chart-container"></div>
                  </el-card>
                </el-col>
              </el-row>
            </div>

            <!-- 详细报表 -->
            <div v-if="reportParams.reportType === 'detail'" class="detail-report">
              <el-table :data="reportData.data?.items || []" stripe>
                <el-table-column prop="code" label="卷材编码" width="180" />
                <el-table-column prop="name" label="卷材名称" />
                <el-table-column prop="materialType" label="材质类型" width="100" />
                <el-table-column prop="width" label="宽幅(m)" width="100" />
                <el-table-column prop="quantity" label="数量" width="80" />
                <el-table-column prop="formattedValue" label="价值" width="120" />
                <el-table-column prop="location" label="存储位置" width="120" />
                <el-table-column prop="formattedDate" label="入库日期" width="120" />
              </el-table>
              
              <!-- 分页 -->
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="reportPagination.page"
                  v-model:page-size="reportPagination.pageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="reportPagination.total"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleReportPageSizeChange"
                  @current-change="handleReportPageChange"
                />
              </div>
            </div>

            <!-- 趋势分析 -->
            <div v-if="reportParams.reportType === 'trend'" class="trend-report">
              <el-card>
                <template #header>
                  <span>库存趋势分析</span>
                </template>
                <div ref="trendChart" class="chart-container large"></div>
              </el-card>
            </div>

            <!-- 深度分析 -->
            <div v-if="reportParams.reportType === 'analysis'" class="analysis-report">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card>
                    <template #header>
                      <span>库存洞察</span>
                    </template>
                    <div class="insights-list">
                      <div
                        v-for="(insight, index) in reportData.data?.insights || []"
                        :key="index"
                        class="insight-item"
                      >
                        <el-icon><TrendCharts /></el-icon>
                        <span>{{ insight }}</span>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card>
                    <template #header>
                      <span>优化建议</span>
                    </template>
                    <div class="recommendations-list">
                      <div
                        v-for="(recommendation, index) in reportData.data?.recommendations || []"
                        :key="index"
                        class="recommendation-item"
                      >
                        <el-icon><Lightbulb /></el-icon>
                        <span>{{ recommendation }}</span>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 周转率分析 -->
      <el-tab-pane label="周转率分析" name="turnover">
        <div class="turnover-section">
          <!-- 周转率控制面板 -->
          <div class="turnover-controls">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-select v-model="turnoverParams.period" placeholder="分析周期" @change="loadTurnoverData">
                  <el-option label="月度分析" value="monthly" />
                  <el-option label="季度分析" value="quarterly" />
                  <el-option label="年度分析" value="yearly" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-input-number
                  v-model="turnoverParams.months"
                  :min="1"
                  :max="36"
                  placeholder="分析月数"
                  @change="loadTurnoverData"
                />
              </el-col>
              <el-col :span="6">
                <el-button type="primary" @click="loadTurnoverData" :loading="loadingTurnover">
                  <el-icon><Refresh /></el-icon>
                  分析周转率
                </el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 周转率分析结果 -->
          <div class="turnover-content" v-loading="loadingTurnover">
            <el-row :gutter="20">
              <!-- 整体周转率 -->
              <el-col :span="8">
                <el-card>
                  <template #header>
                    <span>整体周转率</span>
                  </template>
                  <div class="overall-turnover">
                    <div class="turnover-rate">
                      <span class="rate-value">{{ turnoverData.overallTurnover?.rate || 0 }}</span>
                      <span class="rate-unit">次/年</span>
                    </div>
                    <div class="turnover-trend">
                      <el-tag :type="getTrendType(turnoverData.overallTurnover?.trend)">
                        {{ getTrendText(turnoverData.overallTurnover?.trend) }}
                      </el-tag>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <!-- 分类周转率 -->
              <el-col :span="16">
                <el-card>
                  <template #header>
                    <span>分类周转率分析</span>
                  </template>
                  <el-table :data="turnoverData.categoryAnalysis || []" stripe>
                    <el-table-column prop="category" label="材质类型" width="120" />
                    <el-table-column prop="turnoverRate" label="周转率" width="100" />
                    <el-table-column prop="performance" label="性能等级" width="120">
                      <template #default="{ row }">
                        <el-tag :type="getPerformanceType(row.performance)">
                          {{ getPerformanceText(row.performance) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="avgDays" label="平均库存天数" width="120" />
                    <el-table-column prop="suggestion" label="建议" />
                  </el-table>
                </el-card>
              </el-col>
            </el-row>

            <!-- 周转率趋势图 -->
            <el-card class="turnover-chart-card">
              <template #header>
                <span>周转率趋势</span>
              </template>
              <div ref="turnoverChart" class="chart-container large"></div>
            </el-card>

            <!-- 优化建议 -->
            <el-card>
              <template #header>
                <span>周转率优化建议</span>
              </template>
              <div class="turnover-recommendations">
                <div
                  v-for="(recommendation, index) in turnoverData.recommendations || []"
                  :key="index"
                  class="recommendation-card"
                >
                  <el-icon><Lightbulb /></el-icon>
                  <span>{{ recommendation }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- 库存预警 -->
      <el-tab-pane label="库存预警" name="alerts">
        <div class="alerts-section">
          <!-- 预警控制面板 -->
          <div class="alert-controls">
            <el-row :gutter="20">
              <el-col :span="4">
                <el-select v-model="alertParams.alertType" placeholder="预警类型" clearable @change="loadAlertData">
                  <el-option label="库存预警" value="stock" />
                  <el-option label="过期预警" value="expiry" />
                  <el-option label="质量预警" value="quality" />
                </el-select>
              </el-col>
              <el-col :span="4">
                <el-select v-model="alertParams.severity" placeholder="严重程度" clearable @change="loadAlertData">
                  <el-option label="严重" value="critical" />
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </el-col>
              <el-col :span="6">
                <el-button type="primary" @click="loadAlertData" :loading="loadingAlert">
                  <el-icon><Refresh /></el-icon>
                  刷新预警
                </el-button>
                <el-button @click="handleAllAlerts" :disabled="!alertData.alerts?.length">
                  <el-icon><Check /></el-icon>
                  批量处理
                </el-button>
              </el-col>
            </el-row>
          </div>

          <!-- 预警统计 -->
          <div class="alert-summary">
            <el-row :gutter="20">
              <el-col :span="4">
                <div class="alert-stat critical">
                  <div class="stat-number">{{ alertData.summary?.critical || 0 }}</div>
                  <div class="stat-label">严重</div>
                </div>
              </el-col>
              <el-col :span="4">
                <div class="alert-stat high">
                  <div class="stat-number">{{ alertData.summary?.high || 0 }}</div>
                  <div class="stat-label">高</div>
                </div>
              </el-col>
              <el-col :span="4">
                <div class="alert-stat medium">
                  <div class="stat-number">{{ alertData.summary?.medium || 0 }}</div>
                  <div class="stat-label">中</div>
                </div>
              </el-col>
              <el-col :span="4">
                <div class="alert-stat low">
                  <div class="stat-number">{{ alertData.summary?.low || 0 }}</div>
                  <div class="stat-label">低</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="alert-stat total">
                  <div class="stat-number">{{ alertData.summary?.total || 0 }}</div>
                  <div class="stat-label">总预警数</div>
                </div>
              </el-col>
            </el-row>
          </div>

          <!-- 预警列表 -->
          <div class="alert-list" v-loading="loadingAlert">
            <el-table :data="alertData.alerts || []" stripe>
              <el-table-column type="selection" width="55" />
              <el-table-column prop="type" label="预警类型" width="100">
                <template #default="{ row }">
                  <el-tag>{{ getAlertTypeText(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="severity" label="严重程度" width="100">
                <template #default="{ row }">
                  <el-tag :type="getSeverityTagType(row.severity)" :color="row.severityColor">
                    {{ getSeverityText(row.severity) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="title" label="预警标题" />
              <el-table-column prop="description" label="预警描述" />
              <el-table-column prop="actionRequired" label="所需操作" width="120" />
              <el-table-column prop="formattedTime" label="创建时间" width="160" />
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button size="small" @click="handleAlert(row)">处理</el-button>
                  <el-button size="small" type="danger" @click="dismissAlert(row)">忽略</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <!-- 数据导入导出 -->
      <el-tab-pane label="数据导入导出" name="import-export">
        <div class="import-export-section">
          <el-row :gutter="20">
            <!-- 数据导出 -->
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>数据导出</span>
                </template>
                <div class="export-form">
                  <el-form :model="exportParams" label-width="100px">
                    <el-form-item label="导出类型">
                      <el-select v-model="exportParams.exportType" placeholder="选择导出格式">
                        <el-option label="Excel文件" value="excel" />
                        <el-option label="CSV文件" value="csv" />
                        <el-option label="PDF报告" value="pdf" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="数据类型">
                      <el-select v-model="exportParams.dataType" placeholder="选择数据类型">
                        <el-option label="库存数据" value="inventory" />
                        <el-option label="报表数据" value="reports" />
                        <el-option label="预警数据" value="alerts" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="包含图表">
                      <el-switch v-model="exportParams.includeCharts" />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="handleExport" :loading="exportingData">
                        <el-icon><Download /></el-icon>
                        导出数据
                      </el-button>
                    </el-form-item>
                  </el-form>
                </div>
              </el-card>
            </el-col>

            <!-- 数据导入 -->
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>数据导入</span>
                </template>
                <div class="import-form">
                  <el-form :model="importParams" label-width="100px">
                    <el-form-item label="导入类型">
                      <el-select v-model="importParams.importType" placeholder="选择导入类型">
                        <el-option label="库存数据" value="inventory" />
                        <el-option label="库存调整" value="adjustment" />
                        <el-option label="库存转移" value="transfer" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="选择文件">
                      <el-upload
                        ref="uploadRef"
                        :auto-upload="false"
                        :show-file-list="true"
                        :limit="1"
                        accept=".xlsx,.xls,.csv"
                        @change="handleFileChange"
                      >
                        <el-button>
                          <el-icon><Upload /></el-icon>
                          选择文件
                        </el-button>
                        <template #tip>
                          <div class="el-upload__tip">
                            仅支持 Excel 和 CSV 文件，文件大小不超过 10MB
                          </div>
                        </template>
                      </el-upload>
                    </el-form-item>
                    <el-form-item label="仅验证">
                      <el-switch v-model="importParams.validateOnly" />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="handleImport" :loading="importingData" :disabled="!importParams.file">
                        <el-icon><Upload /></el-icon>
                        导入数据
                      </el-button>
                    </el-form-item>
                  </el-form>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 导入结果 -->
          <div v-if="importResult" class="import-result">
            <el-card>
              <template #header>
                <span>导入结果</span>
              </template>
              <div class="result-summary">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <div class="result-stat">
                      <div class="stat-number">{{ importResult.summary?.totalRows || 0 }}</div>
                      <div class="stat-label">总行数</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="result-stat success">
                      <div class="stat-number">{{ importResult.summary?.successRows || 0 }}</div>
                      <div class="stat-label">成功</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="result-stat error">
                      <div class="stat-number">{{ importResult.summary?.errorRows || 0 }}</div>
                      <div class="stat-label">错误</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="result-stat warning">
                      <div class="stat-number">{{ importResult.summary?.warningRows || 0 }}</div>
                      <div class="stat-label">警告</div>
                    </div>
                  </el-col>
                </el-row>
              </div>

              <!-- 错误详情 -->
              <div v-if="importResult.errors?.length" class="error-details">
                <h4>错误详情</h4>
                <el-table :data="importResult.errors" stripe max-height="300">
                  <el-table-column prop="row" label="行号" width="80" />
                  <el-table-column prop="column" label="列名" width="120" />
                  <el-table-column prop="message" label="错误信息" />
                  <el-table-column prop="value" label="错误值" width="120" />
                </el-table>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- 系统管理 -->
      <el-tab-pane label="系统管理" name="system">
        <div class="system-section">
          <el-row :gutter="20">
            <!-- 系统配置 -->
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>系统配置</span>
                </template>
                <div class="config-form">
                  <el-form :model="systemConfig" label-width="120px">
                    <el-form-item label="自动备份">
                      <el-switch v-model="systemConfig.autoBackup" @change="updateSystemConfig" />
                    </el-form-item>
                    <el-form-item label="备份间隔(小时)">
                      <el-input-number
                        v-model="systemConfig.backupInterval"
                        :min="1"
                        :max="168"
                        @change="updateSystemConfig"
                      />
                    </el-form-item>
                    <el-form-item label="日志保留(天)">
                      <el-input-number
                        v-model="systemConfig.logRetention"
                        :min="7"
                        :max="365"
                        @change="updateSystemConfig"
                      />
                    </el-form-item>
                    <el-form-item label="邮件通知">
                      <el-switch v-model="systemConfig.emailNotification" @change="updateSystemConfig" />
                    </el-form-item>
                  </el-form>
                </div>
              </el-card>
            </el-col>

            <!-- 操作日志 -->
            <el-col :span="12">
              <el-card>
                <template #header>
                  <div class="log-header">
                    <span>操作日志</span>
                    <el-button size="small" @click="loadOperationLogs">
                      <el-icon><Refresh /></el-icon>
                      刷新
                    </el-button>
                  </div>
                </template>
                <div class="log-list" v-loading="loadingLogs">
                  <div
                    v-for="log in operationLogs.logs || []"
                    :key="log.id"
                    class="log-item"
                  >
                    <div class="log-time">{{ log.formattedTime }}</div>
                    <div class="log-content">
                      <span class="log-module">{{ log.moduleDisplay }}</span>
                      <span class="log-operation">{{ log.operationDisplay }}</span>
                      <span class="log-description">{{ log.description }}</span>
                    </div>
                    <div class="log-status" :style="{ color: log.statusColor }">
                      {{ log.status }}
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  Search,
  Download,
  Upload,
  Check,
  Box,
  TrendCharts,
  Lightbulb
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import inventoryVisualizationService from '@/services/inventoryVisualizationService'

export default {
  name: 'InventoryVisualizationManagement',
  components: {
    Refresh,
    Search,
    Download,
    Upload,
    Check,
    Box,
    TrendCharts,
    Lightbulb
  },
  setup() {
    // 响应式数据
    const activeTab = ref('visualization')
    
    // 3D可视化相关
    const loading3D = ref(false)
    const visualization3D = ref(null)
    const visualization3DData = reactive({
      warehouse: null,
      statistics: {}
    })
    const visualizationParams = reactive({
      warehouseId: '',
      areaId: '',
      materialType: ''
    })
    
    // 仓库和区域数据
    const warehouses = ref([
      { id: 'WH001', name: '主仓库' },
      { id: 'WH002', name: '辅助仓库' }
    ])
    const areas = ref([
      { id: 'A001', name: 'A区' },
      { id: 'A002', name: 'B区' },
      { id: 'A003', name: 'C区' }
    ])
    
    // 报表相关
    const loadingReport = ref(false)
    const exportingReport = ref(false)
    const reportData = reactive({ data: null })
    const reportParams = reactive({
      reportType: 'summary',
      materialType: '',
      dateRange: null
    })
    const reportDateRange = ref([])
    const reportPagination = reactive({
      page: 1,
      pageSize: 20,
      total: 0
    })
    
    // 图表引用
    const categoryChart = ref(null)
    const trendChart = ref(null)
    const turnoverChart = ref(null)
    
    // 周转率分析相关
    const loadingTurnover = ref(false)
    const turnoverData = reactive({
      overallTurnover: {},
      categoryAnalysis: [],
      recommendations: []
    })
    const turnoverParams = reactive({
      period: 'monthly',
      months: 12
    })
    
    // 预警相关
    const loadingAlert = ref(false)
    const alertData = reactive({
      alerts: [],
      summary: {}
    })
    const alertParams = reactive({
      alertType: '',
      severity: ''
    })
    
    // 导入导出相关
    const exportingData = ref(false)
    const importingData = ref(false)
    const exportParams = reactive({
      exportType: 'excel',
      dataType: 'inventory',
      includeCharts: false
    })
    const importParams = reactive({
      importType: 'inventory',
      file: null,
      validateOnly: false
    })
    const importResult = ref(null)
    const uploadRef = ref(null)
    
    // 系统管理相关
    const loadingLogs = ref(false)
    const systemConfig = reactive({
      autoBackup: true,
      backupInterval: 24,
      logRetention: 90,
      emailNotification: true
    })
    const operationLogs = reactive({
      logs: [],
      pagination: {}
    })

    // ==================== 3D可视化方法 ====================
    
    /**
     * 加载3D可视化数据
     */
    const load3DData = async () => {
      if (!visualizationParams.warehouseId) {
        ElMessage.warning('请先选择仓库')
        return
      }
      
      loading3D.value = true
      try {
        const data = await inventoryVisualizationService.getInventory3DData(visualizationParams)
        Object.assign(visualization3DData, data)
        ElMessage.success('3D可视化数据加载成功')
      } catch (error) {
        ElMessage.error(error.message || '加载3D可视化数据失败')
      } finally {
        loading3D.value = false
      }
    }
    
    /**
     * 获取区域颜色
     */
    const getAreaColor = (utilization) => {
      if (utilization > 90) return '#ff6b6b'
      if (utilization > 70) return '#ffa502'
      if (utilization > 50) return '#26de81'
      return '#45aaf2'
    }
    
    /**
     * 选择区域
     */
    const selectArea = (area) => {
      ElMessage.info(`选择了区域: ${area.name}`)
      // 这里可以添加区域详情展示逻辑
    }

    // ==================== 报表分析方法 ====================
    
    /**
     * 加载报表数据
     */
    const loadReportData = async () => {
      if (!reportParams.reportType) {
        ElMessage.warning('请选择报表类型')
        return
      }
      
      loadingReport.value = true
      try {
        const data = await inventoryVisualizationService.getInventoryReport(reportParams)
        Object.assign(reportData, data)
        
        // 根据报表类型渲染图表
        await nextTick()
        if (reportParams.reportType === 'summary') {
          renderCategoryChart()
        } else if (reportParams.reportType === 'trend') {
          renderTrendChart()
        }
        
        ElMessage.success('报表数据加载成功')
      } catch (error) {
        ElMessage.error(error.message || '加载报表数据失败')
      } finally {
        loadingReport.value = false
      }
    }
    
    /**
     * 处理日期范围变化
     */
    const handleDateRangeChange = (dates) => {
      if (dates && dates.length === 2) {
        reportParams.dateRange = {
          startDate: dates[0],
          endDate: dates[1]
        }
      } else {
        reportParams.dateRange = null
      }
    }
    
    /**
     * 导出报表
     */
    const exportReport = async () => {
      if (!reportData.data) {
        ElMessage.warning('请先生成报表数据')
        return
      }
      
      exportingReport.value = true
      try {
        const result = await inventoryVisualizationService.exportInventoryData({
          exportType: 'excel',
          dataType: 'reports',
          filters: reportParams
        })
        
        // 创建下载链接
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.fileName
        link.click()
        
        ElMessage.success('报表导出成功')
      } catch (error) {
        ElMessage.error(error.message || '导出报表失败')
      } finally {
        exportingReport.value = false
      }
    }
    
    /**
     * 渲染分类图表
     */
    const renderCategoryChart = () => {
      if (!categoryChart.value || !reportData.data?.categoryBreakdown) return
      
      const chart = echarts.init(categoryChart.value)
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
          name: '分类占比',
          type: 'pie',
          radius: '50%',
          data: reportData.data.categoryBreakdown.map(item => ({
            name: item.category,
            value: item.value
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }
      chart.setOption(option)
    }
    
    /**
     * 渲染趋势图表
     */
    const renderTrendChart = () => {
      if (!trendChart.value || !reportData.data?.chartData) return
      
      const chart = echarts.init(trendChart.value)
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: reportData.data.chartData.map(item => item.date)
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: '库存趋势',
          type: 'line',
          data: reportData.data.chartData.map(item => item.value),
          smooth: true
        }]
      }
      chart.setOption(option)
    }
    
    /**
     * 处理报表分页大小变化
     */
    const handleReportPageSizeChange = (size) => {
      reportPagination.pageSize = size
      loadReportData()
    }
    
    /**
     * 处理报表页码变化
     */
    const handleReportPageChange = (page) => {
      reportPagination.page = page
      loadReportData()
    }

    // ==================== 周转率分析方法 ====================
    
    /**
     * 加载周转率数据
     */
    const loadTurnoverData = async () => {
      loadingTurnover.value = true
      try {
        const data = await inventoryVisualizationService.getInventoryTurnoverAnalysis(turnoverParams)
        Object.assign(turnoverData, data)
        
        // 渲染周转率图表
        await nextTick()
        renderTurnoverChart()
        
        ElMessage.success('周转率分析数据加载成功')
      } catch (error) {
        ElMessage.error(error.message || '加载周转率分析失败')
      } finally {
        loadingTurnover.value = false
      }
    }
    
    /**
     * 渲染周转率图表
     */
    const renderTurnoverChart = () => {
      if (!turnoverChart.value || !turnoverData.chartData) return
      
      const chart = echarts.init(turnoverChart.value)
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: turnoverData.chartData.map(item => item.period)
        },
        yAxis: {
          type: 'value',
          name: '周转率'
        },
        series: [{
          name: '周转率',
          type: 'bar',
          data: turnoverData.chartData.map(item => item.rate),
          itemStyle: {
            color: '#409EFF'
          }
        }]
      }
      chart.setOption(option)
    }
    
    /**
     * 获取趋势类型
     */
    const getTrendType = (trend) => {
      const types = {
        'up': 'success',
        'down': 'danger',
        'stable': 'info'
      }
      return types[trend] || 'info'
    }
    
    /**
     * 获取趋势文本
     */
    const getTrendText = (trend) => {
      const texts = {
        'up': '上升',
        'down': '下降',
        'stable': '稳定'
      }
      return texts[trend] || '稳定'
    }
    
    /**
     * 获取性能类型
     */
    const getPerformanceType = (performance) => {
      const types = {
        'excellent': 'success',
        'good': 'success',
        'average': 'warning',
        'poor': 'danger'
      }
      return types[performance] || 'info'
    }
    
    /**
     * 获取性能文本
     */
    const getPerformanceText = (performance) => {
      const texts = {
        'excellent': '优秀',
        'good': '良好',
        'average': '一般',
        'poor': '较差'
      }
      return texts[performance] || '未知'
    }

    // ==================== 预警管理方法 ====================
    
    /**
     * 加载预警数据
     */
    const loadAlertData = async () => {
      loadingAlert.value = true
      try {
        const data = await inventoryVisualizationService.getInventoryAlerts(alertParams)
        Object.assign(alertData, data)
        ElMessage.success('预警数据加载成功')
      } catch (error) {
        ElMessage.error(error.message || '加载预警数据失败')
      } finally {
        loadingAlert.value = false
      }
    }
    
    /**
     * 处理单个预警
     */
    const handleAlert = async (alert) => {
      try {
        await ElMessageBox.confirm(`确定要处理预警"${alert.title}"吗？`, '确认处理', {
          type: 'warning'
        })
        
        // 这里应该调用处理预警的API
        ElMessage.success('预警处理成功')
        loadAlertData() // 重新加载数据
      } catch (error) {
        // 用户取消操作
      }
    }
    
    /**
     * 忽略预警
     */
    const dismissAlert = async (alert) => {
      try {
        await ElMessageBox.confirm(`确定要忽略预警"${alert.title}"吗？`, '确认忽略', {
          type: 'warning'
        })
        
        // 这里应该调用忽略预警的API
        ElMessage.success('预警已忽略')
        loadAlertData() // 重新加载数据
      } catch (error) {
        // 用户取消操作
      }
    }
    
    /**
     * 批量处理预警
     */
    const handleAllAlerts = async () => {
      try {
        await ElMessageBox.confirm('确定要批量处理所有预警吗？', '确认批量处理', {
          type: 'warning'
        })
        
        // 这里应该调用批量处理预警的API
        ElMessage.success('批量处理成功')
        loadAlertData() // 重新加载数据
      } catch (error) {
        // 用户取消操作
      }
    }
    
    /**
     * 获取预警类型文本
     */
    const getAlertTypeText = (type) => {
      const texts = {
        'stock': '库存预警',
        'expiry': '过期预警',
        'quality': '质量预警'
      }
      return texts[type] || type
    }
    
    /**
     * 获取严重程度标签类型
     */
    const getSeverityTagType = (severity) => {
      const types = {
        'critical': 'danger',
        'high': 'danger',
        'medium': 'warning',
        'low': 'success'
      }
      return types[severity] || 'info'
    }
    
    /**
     * 获取严重程度文本
     */
    const getSeverityText = (severity) => {
      const texts = {
        'critical': '严重',
        'high': '高',
        'medium': '中',
        'low': '低'
      }
      return texts[severity] || severity
    }

    // ==================== 导入导出方法 ====================
    
    /**
     * 处理数据导出
     */
    const handleExport = async () => {
      if (!exportParams.exportType || !exportParams.dataType) {
        ElMessage.warning('请选择导出类型和数据类型')
        return
      }
      
      exportingData.value = true
      try {
        const result = await inventoryVisualizationService.exportInventoryData(exportParams)
        
        // 创建下载链接
        const link = document.createElement('a')
        link.href = result.downloadUrl
        link.download = result.fileName
        link.click()
        
        ElMessage.success('数据导出成功')
      } catch (error) {
        ElMessage.error(error.message || '导出数据失败')
      } finally {
        exportingData.value = false
      }
    }
    
    /**
     * 处理文件选择
     */
    const handleFileChange = (file) => {
      importParams.file = file.raw
    }
    
    /**
     * 处理数据导入
     */
    const handleImport = async () => {
      if (!importParams.file || !importParams.importType) {
        ElMessage.warning('请选择文件和导入类型')
        return
      }
      
      importingData.value = true
      try {
        const result = await inventoryVisualizationService.importInventoryData(importParams)
        importResult.value = result
        
        if (result.success) {
          ElMessage.success('数据导入成功')
        } else {
          ElMessage.warning('数据导入完成，但存在错误，请查看详情')
        }
      } catch (error) {
        ElMessage.error(error.message || '导入数据失败')
      } finally {
        importingData.value = false
      }
    }

    // ==================== 系统管理方法 ====================
    
    /**
     * 更新系统配置
     */
    const updateSystemConfig = async () => {
      try {
        await inventoryVisualizationService.updateSystemConfig('system', systemConfig)
        ElMessage.success('系统配置更新成功')
      } catch (error) {
        ElMessage.error(error.message || '更新系统配置失败')
      }
    }
    
    /**
     * 加载操作日志
     */
    const loadOperationLogs = async () => {
      loadingLogs.value = true
      try {
        const data = await inventoryVisualizationService.getOperationLogs({
          page: 1,
          pageSize: 10
        })
        Object.assign(operationLogs, data)
      } catch (error) {
        ElMessage.error(error.message || '加载操作日志失败')
      } finally {
        loadingLogs.value = false
      }
    }

    // ==================== 工具方法 ====================
    
    /**
     * 格式化货币
     */
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY'
      }).format(value || 0)
    }

    // ==================== 生命周期 ====================
    
    onMounted(() => {
      // 初始化加载数据
      loadAlertData()
      loadOperationLogs()
    })

    return {
      // 响应式数据
      activeTab,
      loading3D,
      visualization3D,
      visualization3DData,
      visualizationParams,
      warehouses,
      areas,
      loadingReport,
      exportingReport,
      reportData,
      reportParams,
      reportDateRange,
      reportPagination,
      categoryChart,
      trendChart,
      turnoverChart,
      loadingTurnover,
      turnoverData,
      turnoverParams,
      loadingAlert,
      alertData,
      alertParams,
      exportingData,
      importingData,
      exportParams,
      importParams,
      importResult,
      uploadRef,
      loadingLogs,
      systemConfig,
      operationLogs,
      
      // 方法
      load3DData,
      getAreaColor,
      selectArea,
      loadReportData,
      handleDateRangeChange,
      exportReport,
      handleReportPageSizeChange,
      handleReportPageChange,
      loadTurnoverData,
      getTrendType,
      getTrendText,
      getPerformanceType,
      getPerformanceText,
      loadAlertData,
      handleAlert,
      dismissAlert,
      handleAllAlerts,
      getAlertTypeText,
      getSeverityTagType,
      getSeverityText,
      handleExport,
      handleFileChange,
      handleImport,
      updateSystemConfig,
      loadOperationLogs,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.inventory-visualization-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.management-tabs {
  margin-top: 20px;
}

/* 3D可视化样式 */
.visualization-section {
  padding: 20px 0;
}

.control-panel {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.visualization-container {
  display: flex;
  gap: 20px;
}

.visualization-main {
  flex: 1;
}

.visualization-canvas {
  height: 500px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.warehouse-3d {
  padding: 20px;
  height: 100%;
}

.warehouse-layout {
  height: 100%;
}

.warehouse-info {
  text-align: center;
  margin-bottom: 20px;
}

.warehouse-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.warehouse-info p {
  margin: 0;
  color: #606266;
}

.areas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  height: calc(100% - 80px);
}

.area-block {
  padding: 15px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.area-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.area-name {
  font-weight: bold;
  margin-bottom: 8px;
}

.area-utilization {
  font-size: 18px;
  margin-bottom: 4px;
}

.area-items {
  font-size: 12px;
  opacity: 0.9;
}

.statistics-panel {
  width: 300px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

/* 报表分析样式 */
.reports-section {
  padding: 20px 0;
}

.report-controls {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.report-content {
  margin-top: 20px;
}

.chart-container {
  height: 300px;
}

.chart-container.large {
  height: 400px;
}

.value-analysis {
  padding: 20px;
}

.total-value, .total-quantity {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.label {
  font-weight: bold;
  color: #606266;
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: #409EFF;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.insights-list, .recommendations-list {
  padding: 20px;
}

.insight-item, .recommendation-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.insight-item .el-icon, .recommendation-item .el-icon {
  margin-right: 10px;
  color: #409EFF;
}

/* 周转率分析样式 */
.turnover-section {
  padding: 20px 0;
}

.turnover-controls {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.turnover-content {
  margin-top: 20px;
}

.overall-turnover {
  text-align: center;
  padding: 20px;
}

.turnover-rate {
  margin-bottom: 15px;
}

.rate-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
}

.rate-unit {
  font-size: 14px;
  color: #909399;
  margin-left: 5px;
}

.turnover-chart-card {
  margin: 20px 0;
}

.turnover-recommendations {
  padding: 20px;
}

.recommendation-card {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
}

.recommendation-card .el-icon {
  margin-right: 10px;
  color: #409EFF;
}

/* 预警样式 */
.alerts-section {
  padding: 20px 0;
}

.alert-controls {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.alert-summary {
  margin-bottom: 20px;
}

.alert-stat {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  color: white;
}

.alert-stat.critical {
  background: #ff4757;
}

.alert-stat.high {
  background: #ff6b6b;
}

.alert-stat.medium {
  background: #ffa502;
}

.alert-stat.low {
  background: #26de81;
}

.alert-stat.total {
  background: #409EFF;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.alert-list {
  margin-top: 20px;
}

/* 导入导出样式 */
.import-export-section {
  padding: 20px 0;
}

.export-form, .import-form {
  padding: 20px;
}

.import-result {
  margin-top: 20px;
}

.result-summary {
  margin-bottom: 20px;
}

.result-stat {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.result-stat.success {
  background: #f0f9ff;
  color: #26de81;
}

.result-stat.error {
  background: #fff5f5;
  color: #ff4757;
}

.result-stat.warning {
  background: #fffbf0;
  color: #ffa502;
}

.error-details {
  margin-top: 20px;
}

.error-details h4 {
  margin-bottom: 15px;
  color: #303133;
}

/* 系统管理样式 */
.system-section {
  padding: 20px 0;
}

.config-form {
  padding: 20px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-list {
  max-height: 400px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409EFF;
}

.log-time {
  font-size: 12px;
  color: #909399;
  min-width: 120px;
}

.log-content {
  flex: 1;
  margin: 0 10px;
}

.log-module, .log-operation {
  display: inline-block;
  padding: 2px 8px;
  margin-right: 8px;
  background: #409EFF;
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.log-description {
  color: #606266;
  font-size: 13px;
}

.log-status {
  font-size: 12px;
  font-weight: bold;
  min-width: 60px;
  text-align: right;
}
</style>

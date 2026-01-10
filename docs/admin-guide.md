# 管理后台使用指南

## 概述

管理后台是一个基于 Vue 3 的单页面应用，用于管理多个 Analytics 项目配置。

## 🚀 Vue 前端对接指南

如果你正在开发或部署前端项目 (Vue 3 + Vite)，请参考以下关键配置：

### 1. 请求头配置 (Headers)

必须在 Axios 拦截器中添加 `Authorization` 头（Bearer 格式）：

```javascript
// src/utils/request.js
service.interceptors.request.use(config => {
  // 从 localStorage 或 Store 获取 Token
  const token = localStorage.getItem('admin_token'); 
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}` 
  }
  return config
})
```

> ⚠️ 注意：旧版的 URL 参数 `?token=` 方式已废弃，必须使用 Header。

### 2. BaseURL 配置

根据环境配置 VITE_API_URL：

**开发环境 (.env.development)**:
```env
VITE_API_URL = 'http://localhost:3001'
# 或局域网IP: http://192.168.0.104:3001
```

**生产环境 (.env.production)**:
```env
VITE_API_URL = 'https://api.yourdomain.com'
```

### 3. CORS (跨域)

- **开发模式** (`pnpm run dev`): 后端自动允许所有跨域 (*)，允许 HTTP 访问。
- **生产模式**: 后端会启用严格的安全策略。

---

## 访问方式

URL: 请先启动 Vue 前端项目
前端项目地址: [https://github.com/hachinekooo/analyticshub-front](https://github.com/hachinekooo/analyticshub-front)

**核心配置**:
- 必须在 Request Header 中携带 `Authorization: Bearer <token>`
- 开发环境 API 地址: `http://localhost:3001`

## 界面预览

管理后台采用现代化的卡片式布局，包含：

- 📊 项目列表展示
- ➕ 添加项目按钮
- 🏥 实时健康状态检查
- ⚙️ 快速操作按钮

## 功能说明

### 1. 项目列表

显示所有已配置的项目，每个项目卡片包含：

- **项目名称** - 显示名称
- **项目ID** - 唯一标识符
- **数据库信息** - 数据库地址、名称
- **表前缀** - analytics表前缀
- **运行状态** - 激活/停用
- **健康状态** - 数据库连接和表状态

#### 健康状态指示器

- ✅ **绿色 - 正常** - 数据库连接成功，表存在
- ⚠️ **黄色 - 警告** - 数据库连接正常，但表缺失
- ❌ **红色 - 错误** - 数据库连接失败

### 2. 添加项目

点击右上角"+ 添加项目"按钮，填写以下信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| 项目ID | 唯一标识符，小写字母/数字/下划线/横线 | `memobox` |
| 项目名称 | 显示名称 | `MemoBox` |
| 数据库地址 | PostgreSQL 服务器地址 | `localhost` |
| 数据库端口 | PostgreSQL 端口 | `5432` |
| 数据库名称 | 项目专属数据库 | `memobox` |
| 数据库用户 | 数据库用户名 | `root` |
| 数据库密码 | 数据库密码 | `***` |
| 表前缀 | 表前缀（避免冲突） | `analytics_` |
| 状态 | 是否激活 | 激活 |

**注意事项**：
- 项目ID创建后不可修改
- 确保数据库已创建
- 表前缀用于避免与业务表冲突

### 3. 编辑项目

点击项目卡片中的"编辑"按钮，可以修改：
- 项目名称
- 数据库连接信息
- 表前缀
- 激活状态

**不可修改**：项目ID（唯一标识符）

### 4. 删除项目

点击"删除"按钮可删除项目配置。

**注意**：
- 系统项目 `analytics-system` 不可删除
- 删除配置不会删除实际数据
- 删除后需手动清理数据库数据

### 5. 检查状态

点击"检查状态"按钮，系统会检查：

1. **数据库连接** - 能否连接到指定数据库
2. **表完整性** - 检查4张必需表是否存在：
   - `{prefix}devices`
   - `{prefix}events`
   - `{prefix}sessions`
   - `{prefix}traffic_metrics`

### 6. 初始化数据库

当项目数据库表缺失时，会显示"初始化表"按钮。

**初始化流程**：
1. 点击"初始化"按钮
2. 确认操作
3. 系统读取 `database/project-init.sql`
4. 替换表前缀占位符
5. 在项目数据库中创建4张表
6. 完成并显示成功消息

**创建的表**：
```sql
{prefix}devices         -- 设备注册表
{prefix}events          -- 事件记录表  
{prefix}sessions        -- 会话记录表
{prefix}traffic_metrics -- 流量指标表
```

## 使用场景

### 场景1：为新项目接入 Analytics

#### 步骤

1. **准备数据库**
   ```sql
   CREATE DATABASE memobox WITH ENCODING = 'UTF8';
   ```

2. **添加项目配置**
   - 访问管理后台
   - 点击"+ 添加项目"
   - 填写表单:
     - 项目ID: `memobox`
     - 项目名称: `MemoBox`
     - 数据库名称: `memobox`
     - 其他信息...
   - 点击保存

3. **测试连接**
   - 点击"检查状态"
   - 确认数据库连接成功（绿色）

4. **初始化表**
   - 点击"初始化"按钮
   - 确认操作
   - 等待完成

5. **验证**
   - 再次点击"检查状态"
   - 确认所有表都显示绿色✓

6. **配置客户端**
   ```javascript
   // iOS 客户端
   headers['X-Project-ID'] = 'memobox'
   ```

### 场景2：修改现有项目数据库

假设需要更换数据库服务器：

1. 准备新数据库
2. 在管理后台点击"编辑"
3. 修改数据库地址和端口
4. 保存
5. 点击"检查状态"验证
6. 点击"初始化"创建表

### 场景3：处理表名冲突

如果业务数据库已有 `devices` 表：

1. 编辑项目
2. 修改表前缀为 `stats_` 或 `tracking_`
3. 保存
4. 重新初始化数据库
5. 客户端无需修改（自动使用新前缀）

## 常见问题

### Q: 数据库连接失败？

**检查项**：
- 数据库服务是否启动
- 地址和端口是否正确
- 数据库名称是否存在
- 用户名密码是否正确
- 防火墙是否允许连接

### Q: 表初始化失败？

**可能原因**：
- 数据库权限不足
- 表已存在（使用其他前缀）
- SQL脚本错误

**解决方案**：
1. 检查数据库用户权限
2. 手动执行 `database/project-init.sql`
3. 查看服务器日志

### Q: 修改表前缀后数据丢失？

**原因**：修改前缀相当于使用新表

**建议**：
- 不要随意修改已有项目的表前缀
- 如需修改，先备份数据
- 或使用数据库迁移工具

### Q: 删除项目后数据还在？

**说明**：删除项目只删除配置，不删数据

**清理数据**：
```sql
-- 手动清理
DROP TABLE analytics_devices;
DROP TABLE analytics_events;
DROP TABLE analytics_sessions;
DROP TABLE analytics_traffic_metrics;
```

### Q: 忘记管理员Token？

**解决**：
1. 查看 `.env` 文件中的 `ADMIN_TOKEN`
2. 或修改 `.env` 设置新Token
3. 重启服务

## 安全建议

### 1. 强Token

不要使用默认Token，使用强随机值：

```bash
# 生成随机Token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. 访问控制

- 仅在内网访问管理后台
- 或使用 Nginx 添加 IPWhiteList
- 生产环境考虑 HTTPS

### 3. 定期审查

- 定期检查项目列表
- 删除不用的项目配置
- 审查数据库访问日志

## 技术细节

### API 端点

管理后台调用以下 API：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/projects` | 获取项目列表 |
| POST | `/api/admin/projects` | 创建项目 |
| PUT | `/api/admin/projects/:id` | 更新项目 |
| DELETE | `/api/admin/projects/:id` | 删除项目 |
| GET | `/api/admin/projects/:id/health` | 检查健康状态 |
| POST | `/api/admin/projects/:id/init` | 初始化数据库 |

### 认证方式

必须使用 Header 携带 Token：

```http
Authorization: Bearer <your_token>
```

> ❌ 已废弃: URL参数 `?token=` 和自定义头 `X-Admin-Token` 不再支持。

### 响应格式

成功响应：
```json
{
  "success": true,
  "data": {...}
}
```

错误响应：
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

## 故障排查

### 页面空白

1. 打开浏览器控制台（F12）
2. 查看 Console 错误
3. 检查 Network 请求
4. 可能原因：
   - CDN加载失败
   - Token错误
   - API请求失败

### 功能不工作

1. 检查服务器日志
2. 验证Token是否正确
3. 确认后端服务运行
4. 检查数据库连接

## 后续更新

计划功能：
- [ ] 数据统计概览
- [ ] 实时事件监控
- [ ] 用户行为分析
- [ ] 导出数据报表
- [ ] JWT认证替代固定Token

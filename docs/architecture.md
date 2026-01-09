# 架构设计文档

## 系统概览

Analytics API Service 是一个通用的数据埋点和分析后端服务，支持多项目多租户架构。

### 核心特性

- 📊 **多项目支持** - 一个后端服务支持多个项目
- 🔐 **独立数据隔离** - 每个项目可配置独立数据库
- 🎛️ **可视化管理** - Vue管理后台，轻松配置项目
- 🚀 **自动初始化** - 自动创建数据库和表
- 🔧 **灵活配置** - 支持表前缀自定义

## 系统架构

### 整体架构

```
┌─────────────────────────────────────────────┐
│           Analytics API Service             │
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │  Admin API   │      │  Analytics API  │ │
│  │  (管理后台)   │      │  (数据收集)      │ │
│  └──────────────┘      └─────────────────┘ │
│           │                     │           │
│           v                     v           │
│  ┌──────────────────────────────────────┐  │
│  │      ProjectManager (项目管理)        │  │
│  │      DatabaseManager (连接池管理)     │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
             │                     │
             v                     v
    ┌───────────────┐     ┌───────────────┐
    │ analytics DB  │     │  memobox DB   │
    │ (系统配置)     │     │  (项目数据)    │
    └───────────────┘     └───────────────┘
```

### 多项目架构

#### 数据库设计

**系统数据库** (analytics)
```sql
analytics_projects  -- 项目配置表
  ├── project_id
  ├── project_name
  ├── db_host/db_port/db_name
  └── table_prefix
```

**项目数据库** (如: memobox)
```sql
analytics_devices         -- 设备注册
analytics_events          -- 事件记录
analytics_sessions        -- 会话记录
analytics_traffic_metrics -- 流量指标
```

#### 请求流程

```
1. 客户端请求
   ├── Header: X-Project-ID: memobox
   └── Header: X-API-Key: xxx

2. 认证中间件
   ├── 加载项目配置
   ├── 获取项目数据库连接
   └── 验证设备

3. 业务路由
   ├── 使用 req.dbPool (项目连接池)
   ├── 使用 req.getTableName('events') (动态表名)
   └── 插入数据

4. 响应
   └── 返回结果
```

## 核心模块

### 1. ProjectManager (项目管理器)

**职责**:
- 从 `analytics_projects` 表加载项目配置
- 缓存项目配置，定期刷新
- 提供项目信息查询接口

**关键方法**:
```javascript
await projectManager.initialize()
const project = await projectManager.getProject('memobox')
await projectManager.reloadProject('memobox')
```

### 2. DatabaseManager (数据库管理器)

**职责**:
- 管理多个项目的数据库连接池
- 提供动态表名生成
- 连接池复用和清理

**关键方法**:
```javascript
const pool = await dbManager.getPool('memobox')
const tableName = await dbManager.getTableName('memobox', 'events')
// 返回: analytics_events (或自定义前缀)
```

### 3. 认证中间件

**流程**:
1. 提取 `X-Project-ID` (默认: analytics-system)
2. 加载项目配置
3. 获取项目数据库连接
4. 验证 API Key
5. 注入上下文到 `req` 对象

**上下文注入**:
```javascript
req.projectId = 'memobox'
req.dbPool = <项目连接池>
req.getTableName = (baseName) => `${prefix}${baseName}`
req.deviceInfo = <设备信息>
```

### 4. 管理后台

**功能**:
- 项目CRUD管理
- 数据库连接测试
- 一键数据库初始化
- 健康状态检查

**技术栈**:
- Vue 3 (CDN)
- Element Plus
- Axios

## 数据流向

### 事件上报流程

```
iOS App (MemoBox)
  │
  ├─ POST /api/v1/events
  │  └─ Header: X-Project-ID: memobox
  │     Header: X-API-Key: xxx
  │
  v
认证中间件 (verifyAuth)
  │
  ├─ 加载 memobox 项目配置
  ├─ 获取 memobox 数据库连接
  └─ 验证设备
  │
  v
events.js (路由处理)
  │
  ├─ req.dbPool.query(...)
  ├─ INSERT INTO analytics_events
  └─ 返回成功
```

### 项目添加流程

```
管理员
  │
  ├─ 访问 /admin.html?token=xxx
  │
  v
添加项目
  │
  ├─ 填写表单
  │  ├─ project_id: memobox
  │  ├─ db_host: localhost
  │  └─ db_name: memobox
  │
  v
POST /api/admin/projects
  │
  ├─ INSERT INTO analytics_projects
  ├─ projectManager.reloadProject()
  └─ 返回成功
  │
  v
初始化数据库
  │
  ├─ POST /api/admin/projects/:id/init
  ├─ 读取 database/project-init.sql
  ├─ 替换 {{PREFIX}} 为 analytics_
  └─ 创建 4 张表
```

## 安全设计

### 1. 项目隔离

- 每个项目独立数据库连接池
- 查询时自动过滤 `project_id`
- 无法跨项目访问数据

### 2. 认证机制

**设备认证**:
- API Key + Secret Key
- 每个设备唯一
- 支持设备封禁

**管理认证**:
- 固定 Token (环境变量)
- 简单但有效
- 后续可升级为 JWT

### 3. 数据安全

- **密码加密存储**: 
  - 项目数据库密码使用 AES-256-CBC 加密存储
  - 密钥 (`DATA_ENCRYPTION_KEY`) 仅在后端环境变量中
  - 即使数据库泄露，攻击者也无法获取连接密码
- **SQL安全**: 参数化查询防注入
- **连接安全**: 数据库连接池超时自动清理

## 性能优化

### 1. 连接池复用

```javascript
// 每个项目一个连接池
pools.set('memobox', new Pool({...}))
pools.set('another', new Pool({...}))

// 复用连接，避免频繁创建
```

### 2. 配置缓存

```javascript
// ProjectManager 缓存
projects.set('memobox', {...config})

// 定期刷新，避免每次查询数据库
```

### 3. 索引优化

- 主键索引
- 复合索引 (project_id, device_id)
- 时间戳索引 (created_at DESC)

## 扩展性

### 水平扩展

1. **无状态设计** - 服务可多实例部署
2. **连接池管理** - 自动管理数据库连接
3. **负载均衡** - Nginx 反向代理

### 功能扩展

1. **新增数据表** - 更新 `project-init.sql`
2. **新增API** - 在 routes 目录添加路由
3. **新增中间件** - 在 middleware 目录添加

## 最佳实践

### 1. 添加新项目

```bash
# 1. 管理后台添加项目配置
# 2. 测试数据库连接
# 3. 初始化数据库表
# 4. 配置客户端 X-Project-ID
```

### 2. 表前缀使用

**场景**: 业务库已有 `devices` 表

**解决**: 设置 `table_prefix = "stats_"`

**结果**: 创建 `stats_devices` 而非 `analytics_devices`

### 3. 数据库选择

**独立数据库** (推荐):
- ✅ 数据完全隔离
- ✅ 易于备份和迁移
- ✅ 安全性高

**共享数据库** (省成本):
- 通过表前缀区分
- 适合小型项目
- 权限管理复杂

## 技术栈

### 后端
- Node.js 18+
- Express.js
- PostgreSQL 15
- pg (node-postgres)

### 管理后台
- Vue 3
- Element Plus
- Axios

### 工具
- nodemon (开发热重载)
- dotenv (环境变量)
- helmet (安全头)

## 未来规划

- [ ] JWT 认证替换固定 Token
- [ ] 密码加密存储
- [ ] 实时数据分析 Dashboard
- [ ] 数据导出功能
- [ ] WebSocket 实时推送
- [ ] Docker 镜像发布

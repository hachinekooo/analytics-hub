# Analytics Hub

> 通用数据埋点与分析后端服务 - 支持多项目、自动初始化、可视化管理

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)](https://www.postgresql.org/)

## ✨ 核心特性

- 📊 **多项目支持** - 一个后端服务支持多个项目，数据完全隔离
- 🚀 **自动初始化** - 自动创建数据库和表，零配置启动
- 🎛️ **可视化管理** - Vue 3 管理后台，轻松管理项目配置
- 🔐 **数据隔离** - 每个项目独立数据库，安全可靠
- 🛡️ **安全加固** - 数据库密码 AES-256 加密存储，拒绝拖库风险
- 🔧 **灵活配置** - 支持表前缀自定义，避免命名冲突
- ⚡ **高性能** - 连接池管理、索引优化、缓存机制

## 📖 文档

- [快速开始](./docs/quick-start.md) - 5分钟快速部署
- [架构设计](./docs/architecture.md) - 系统架构和设计思路
- [管理后台使用指南](./docs/admin-guide.md) - 管理后台详细说明
- [数据库配置](./docs/database.md) - 数据库安装和配置
- [API文档](./docs/api.md) - 接口文档和使用示例

## 🚀 快速开始

### 前提条件

- Node.js 18+
- PostgreSQL 15+
- pnpm (推荐) 或 npm

### 安装运行

```bash
# 1. 克隆项目
git clone https://github.com/hachinekooo/analytics-hub.git
cd analytics-hub/backend

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 设置数据库和Token

# 4. 启动服务（自动初始化数据库）
pnpm run dev
```

服务启动后：
- API服务: `http://localhost:3001`
- 管理后台: `http://localhost:3001/admin.html?token=YOUR_TOKEN`

## 🎯 使用场景

### 场景1: 接入新项目

```bash
1. 访问管理后台
2. 添加项目配置（项目ID、数据库信息）
3. 测试数据库连接
4. 一键初始化表
5. 客户端带上 X-Project-ID 请求
```

### 场景2: iOS 客户端

```swift
// 设置项目ID
headers["X-Project-ID"] = "memobox"

// 注册设备
POST /api/v1/auth/register

// 上报事件
POST /api/v1/events
```

## 📁 项目结构

```
backend/
├── docs/                # 文档目录
│   ├── quick-start.md  # 快速开始
│   ├── architecture.md # 架构设计
│   ├── admin-guide.md  # 管理后台指南
│   └── database.md     # 数据库配置
├── database/            # 数据库脚本
│   ├── init.sql        # 系统表初始化
│   └── project-init.sql# 项目表初始化
├── public/              # 静态文件
│   └── admin.html      # 管理后台
├── src/
│   ├── config/         # 配置文件
│   ├── middleware/     # 中间件
│   ├── routes/         # 路由
│   ├── utils/          # 工具函数
│   └── server.js       # 入口文件
├── .env.example        # 环境变量模板
└── package.json
```

## 🔑 主要API

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/v1/auth/register` | POST | 设备注册 |
| `/api/v1/events` | POST | 事件上报 |
| `/api/v1/sessions` | POST | 会话上报 |
| `/api/admin/projects` | GET/POST | 项目管理 |

## 🛡️ 安全性

- ✅ API Key + Device ID 双重认证
- ✅ 数据库密码 AES-256 加密存储
- ✅ SQL 参数化查询防注入
- ✅ Helmet 安全头
- ✅ CORS 跨域控制
- ✅ Rate Limiting 速率限制
- ✅ 环境变量敏感信息

## 🌟 核心特色

### 多项目架构

```
系统数据库(analytics)     项目数据库(memobox)
├── analytics_projects    ├── analytics_devices
└── (配置表)              ├── analytics_events
                         ├── analytics_sessions
                         └── analytics_traffic_metrics
```

### 自动初始化

服务启动时自动检查并创建：
1. 检查数据库是否存在 → 不存在则创建
2. 检查表是否存在 → 不存在则执行 init.sql
3. 完成！无需手动初始化

### 可视化管理

- 实时健康检查 ✅
- 一键初始化数据库 ⚡
- 项目CRUD管理 🎛️
- 连接测试 🔌

## 📊 技术栈

**后端**:
- Node.js 18 + Express.js
- PostgreSQL 15 + pg
- Helmet + CORS + Rate Limit

**管理后台**:
- Vue 3 (CDN)
- Element Plus
- Axios

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

[MIT](./backend/LICENSE)

## 🔗 相关链接

- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Express.js 文档](https://expressjs.com/)
- [Vue 3 文档](https://vuejs.org/)

## 📞 支持

遇到问题？
- 查看 [文档](./docs/)
- 提交 [Issue](https://github.com/hachinekooo/analytics-hub/issues)
- 查看 [常见问题](./docs/admin-guide.md#常见问题)

## 📧 联系作者

- **Email**: hachineko@yeah.net
- **GitHub**: [@hachinekooo](https://github.com/hachinekooo)

欢迎交流和反馈！

---

## ☕ 请我喝杯咖啡

如果这个项目对你有帮助，可以请我喝杯咖啡 😊

欢迎扫码支持，你的支持是我持续更新的动力！

<div align="center">
  <img src="./docs/img/wechat-pay.jpg" alt="微信赞赏码" width="200"/>
  <img src="./docs/img/alipay.jpg" alt="支付宝收款码" width="200"/>
  
  <p><i>微信 & 支付宝</i></p>
</div>

<div align="center">
  <img src="./docs/img/wechat-qr.jpg" alt="个人微信" width="200"/>
  
  <p><i>添加微信 | 技术交流</i></p>
</div>



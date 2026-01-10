/**
 * Analytics API Service - Main Server
 * 
 * 多项目analytics数据收集和分析API服务
 * 支持多个项目共享一个后端服务，每个项目可配置独立数据库
 * 
 * @author Your Name
 * @license MIT
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// ============ 中间件配置 ============
// 安全头部
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
            imgSrc: ["'self'", "data:", "https:"],
            // 开发环境允许 http 连接 (方便本地调试)，生产环境仅允许 https
            connectSrc: isProduction
                ? ["'self'", "https://unpkg.com"]
                : ["'self'", "https://unpkg.com", "http:", "ws:"],
        },
    },
    // 仅在生产环境启用 强制HTTPS (HSTS)
    hsts: isProduction,
}));

// CORS配置
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    // 务必允许 Authorization 头，否则前端无法携带 Token
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Device-ID', 'X-User-ID', 'X-Timestamp', 'X-Signature', 'X-App-Version'],
}));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 速率限制
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: '请求过于频繁，请稍后再试',
        },
        timestamp: new Date().toISOString(),
    },
});
app.use(limiter);

// 请求日志
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// ============ 路由配置 ============

// 健康检查
app.use('/health', healthRouter);

// 认证路由
const authRouter = require('./routes/auth');
app.use('/api/v1/auth', authRouter);

// 受保护的测试路由
const protectedRouter = require('./routes/protected');
app.use('/api/v1/protected', protectedRouter);

// 事件追踪路由
const eventsRouter = require('./routes/events');
app.use('/api/v1/events', eventsRouter);

// 会话管理路由
const sessionsRouter = require('./routes/sessions');
app.use('/api/v1/sessions', sessionsRouter);

// 管理后台路由
const adminRouter = require('./routes/admin');
app.use('/api/admin', adminRouter);



// API路由（预留）

// ============ 错误处理 ============

// 404处理
app.use(notFoundHandler);

// 统一错误处理
app.use(errorHandler);

// ============ 服务器启动 ============

async function startServer() {
    try {
        // 1. 自动初始化系统表
        const { autoInitSystemDatabase } = require('./utils/autoInit');
        await autoInitSystemDatabase();

        // 2. 测试数据库连接
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.warn('⚠ 警告: 数据库连接失败，但服务器将继续启动');
        }

        // 3. 启动HTTP服务器
        // 默认监听所有接口 (0.0.0.0) 以支持局域网访问
        const HOST = process.env.HOST || '0.0.0.0';
        app.listen(PORT, HOST, () => {
            console.log('');
            console.log('='.repeat(50));
            console.log(`✓ 分析API服务已启动`);
            console.log(`  地址: http://${HOST}:${PORT}`);
            console.log(`  环境: ${isProduction ? 'production' : 'development'}`);
            console.log(`  健康检查: http://localhost:${PORT}/health`);
            console.log('='.repeat(50));
            console.log('');
        });
    } catch (error) {
        console.error('✗ 服务器启动失败:', error);
        process.exit(1);
    }
}

// 启动服务器
startServer();

module.exports = app;

/**
 * 管理后台Token认证中间件
 * 简单的固定Token认证，仅供管理员使用
 */

const requireAdminToken = (req, res, next) => {
    // 从查询参数或请求头获取token
    // 支持标准 Bearer Token 格式
    let token = req.query.token || req.headers['x-admin-token'];

    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
        }
    }

    // 验证token
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken) {
        return res.status(500).json({
            success: false,
            error: {
                code: 'ADMIN_TOKEN_NOT_CONFIGURED',
                message: '管理员Token未配置，请在环境变量中设置ADMIN_TOKEN',
            },
        });
    }

    if (token && token === adminToken) {
        next();
    } else {
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: '未授权：无效的管理员Token',
            },
        });
    }
};

module.exports = { requireAdminToken };

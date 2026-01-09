const { Pool } = require('pg');
const { decrypt } = require('../utils/crypto');

// 项目配置管理器的专用连接池（避免循环依赖）
let configPool = null;

function getConfigPool() {
    if (!configPool) {
        configPool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.DB_NAME || 'analytics',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
        });
    }
    return configPool;
}

/**
 * 项目配置管理器
 * 负责加载和缓存项目配置
 */
class ProjectManager {
    constructor() {
        this.projects = new Map();
        this.initialized = false;
    }

    /**
     * 初始化 - 加载所有激活的项目
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const pool = getConfigPool();
            const result = await pool.query(
                'SELECT * FROM analytics_projects WHERE is_active = TRUE'
            );

            for (const row of result.rows) {
                this.projects.set(row.project_id, {
                    id: row.id,
                    projectId: row.project_id,
                    projectName: row.project_name,
                    database: {
                        host: row.db_host,
                        port: row.db_port,
                        database: row.db_name,
                        user: row.db_user,
                        password: decrypt(row.db_password_encrypted) || (row.project_id === 'analytics-system' ? process.env.DB_PASSWORD : undefined),
                    },
                    tablePrefix: row.table_prefix || 'analytics_',
                    isActive: row.is_active,
                });
            }

            this.initialized = true;
            console.log(`✓ 已加载 ${this.projects.size} 个项目配置`);
        } catch (error) {
            console.error('✗ 项目配置加载失败:', error);
            throw error;
        }
    }

    /**
     * 获取项目配置
     */
    async getProject(projectId) {
        if (!this.initialized) {
            await this.initialize();
        }

        return this.projects.get(projectId);
    }

    /**
     * 重新加载项目配置
     */
    async reloadProject(projectId) {
        try {
            const pool = getConfigPool();
            const result = await pool.query(
                'SELECT * FROM analytics_projects WHERE project_id = $1',
                [projectId]
            );

            if (result.rows.length > 0) {
                const row = result.rows[0];
                this.projects.set(row.project_id, {
                    id: row.id,
                    projectId: row.project_id,
                    projectName: row.project_name,
                    database: {
                        host: row.db_host,
                        port: row.db_port,
                        database: row.db_name,
                        user: row.db_user,
                        password: decrypt(row.db_password_encrypted) || (row.project_id === 'analytics-system' ? process.env.DB_PASSWORD : undefined),
                    },
                    tablePrefix: row.table_prefix || 'analytics_',
                    isActive: row.is_active,
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error(`✗ 重新加载项目配置失败 (${projectId}):`, error);
            return false;
        }
    }

    /**
     * 检查项目是否存在且激活
     */
    async isProjectActive(projectId) {
        const project = await this.getProject(projectId);
        return project && project.isActive;
    }

    /**
     * 列出所有项目
     */
    async listProjects() {
        if (!this.initialized) {
            await this.initialize();
        }
        return Array.from(this.projects.values());
    }
}

// 创建单例
const projectManager = new ProjectManager();

module.exports = { projectManager };

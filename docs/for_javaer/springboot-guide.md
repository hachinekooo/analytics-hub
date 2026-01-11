# Spring Boot 开发者快速上手指南

本文档专为熟悉 Spring Boot 生态的 Java 开发者编写，旨在通过类比的方式，帮助你快速理解本项目的核心架构和语法。

## 1. 核心概念映射

| 概念 | Spring Boot (Java) | Node.js (Express) | 说明 |
|------|--------------------|-------------------|------|
| **构建工具** | Maven / Gradle | npm / pnpm | `package.json` 等同于 `pom.xml`，`node_modules` 是本地依赖库 |
| **Web 框架** | Spring Web MVC | Express.js | 负责处理 HTTP 请求、路由和中间件 |
| **入口类** | `@SpringBootApplication` | `server.js` | 程序的启动入口，声明中间件和路由 |
| **路由层** | `@Controller` / `@RestController` | `Router` (如 `src/routes/xx.js`) | 定义 URL 路径和处理函数 |
| **拦截器** | `HandlerInterceptor` / `Filter` | `Middleware` (中间件) | `app.use()` 或路由级中间件，用于鉴权、日志等 |
| **数据访问** | JDBC / JPA / MyBatis | `pg` (node-postgres) | 直接使用 SQL 或查询构造器，本项目使用原生 SQL |
| **配置管理** | `application.yml` / `@Value` | `dotenv` (.env) | 通过 `process.env.XXX` 读取环境变量 |
| **异步处理** | `@Async` / `CompletableFuture` | `async/await` | JS 默认单线程异步，`await` 只是语法糖，写法类似同步代码 |

---

## 2. 项目结构对比

```
backend/
├── src/
│   ├── config/          # 等同于 @Configuration 类
│   │   ├── database.js  # 数据库连接池配置 (类似 DataSourceConfig)
│   │   └── projects.js  # 项目配置加载器 (类似 @RefreshScope 配置中心)
│   │
│   ├── middleware/      # 等同于 Filter / Interceptor
│   │   ├── auth.js      # 认证拦截器 (Spring Security Filter链)
│   │   └── adminAuth.js # 管理后台认证
│   │
│   ├── routes/          # 等同于 @RestController
│   │   ├── events.js    # EventController
│   │   └── auth.js      # AuthController
│   │
│   ├── utils/           # 等同于 Util 工具类
│   │   ├── crypto.js    # 加密工具类 (CryptoUtils)
│   │   └── dbInit.js    # 数据库初始化脚本
│   │
│   └── server.js        # Application.java (main函数)
│
├── package.json         # pom.xml
└── .env                 # application.properties
```

---

## 3. 核心工具类解析 (源码导读)

### 3.1 这里没有 Spring IOC 容器？
是的，Node.js 项目通常不像 Spring 那样强依赖依赖注入 (DI) 容器。
*   **做法**：我们通常直接 `require` (导入) 需要的模块，或者通过函数参数传递依赖。
*   **单例模式**：Node.js 的 `require` 机制天生就是单例的。例如 `const dbManager = require('./config/database')` 拿到的就是同一个实例，**等同于 Spring 的 `@Autowired` 单例 Bean**。

### 3.2 核心工具：`DatabaseManager`
> 位置: `src/config/database.js`

这是本项目的核心，相当于 Spring 的 `DataSource` + `JdbcTemplate`。
*   **多租户支持**：不同于常规 Spring Boot 单数据源，这个类维护了一个 `Map<projectId, Pool>`。
*   **动态连接池**：`getPool(projectId)` 方法会检查该项目是否已有连接池，没有则根据配置动态创建。这类似 Spring 的 `AbstractRoutingDataSource`，但更灵活。

```javascript
// 伪代码对比
// Java
dataSourceMap.get(projectId).getConnection();

// Node.js
await dbManager.getPool(projectId).query('SELECT ...');
```

### 3.3 核心工具：`ProjectManager`
> 位置: `src/config/projects.js`

这就好比一个动态的**配置中心 (Config Server)**。
*   它启动时会从数据库加载所有项目的配置（DB URL、密码等）并缓存到内存。
*   提供了 `reloadProject(id)` 方法，可以在不重启服务的情况下刷新单个项目的配置（类似 Spring Cloud Bus 的 `/actuator/refresh`）。

### 3.4 认证中间件 (`verifyAuth`)
> 位置: `src/middleware/auth.js`

这完全等同于一个 `OncePerRequestFilter`。
*   **拦截逻辑**：
    1.  获取 Request Header 里的 `X-Project-ID`。
    2.  校验 `X-API-Key` 和 `X-Signature`。
    3.  **Context 注入**：验证通过后，将项目信息挂载到 `req` 对象上：`req.projectId = ...`。这就好比 Spring Security 把 `Authentication` 对象放到 `SecurityContextHolder` 里，后续的 Controller (Router)都可以直接用。

---

## 4. 常见语法速查

### Async/Await 是什么？
不要被 JS 的异步回调地狱吓到，现代 JS 使用 `async/await`，写起来和 Java 甚至没区别。

**Node.js 写法**:
```javascript
async function getUser(id) {
    // 这一行会"暂停"等待数据库返回，但不会阻塞线程（非阻塞I/O）
    const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return user;
}
```

**Java 写法**:
```java
public User getUser(String id) {
    // 这一行会阻塞当前线程
    return jdbcTemplate.queryForObject("SELECT ...", ...);
}
```

相关文章：[并发模型演变](https://hachinekooo.github.io/docs/code/knowledge/the-evolution-of-concurrency-models.html)

### 箭头函数 `=>`
就是 Java 的 **Lambda 表达式**。
```javascript
// JS
const sum = (a, b) => a + b;

// Java
BiFunction<Integer, Integer, Integer> sum = (a, b) -> a + b;
```

### 解构赋值
Java 没有这个酷炫特性，它能让你从对象中快速提取属性。
```javascript
const { username, password } = req.body;
// 等同于:
// String username = req.getBody().getUsername();
// String password = req.getBody().getPassword();
```

---

## 总结
这个项本质上是一个**多租户的 API 网关**。
1.  **Server.js** 启动 HTTP 服务。
2.  请求进来，先过 **Middleware** (Auth)。
3.  **Middleware** 识别是哪个 Project，从 **DatabaseManager** 拿到对应的数据库连接。
4.  **Router** (Controller) 执行 SQL 写入数据。
5.  返回 JSON。

逻辑链路和 Spring Boot 完全一致，只是没有了沉重的 XML/Annotation 配置，一切都是显式的代码逻辑。

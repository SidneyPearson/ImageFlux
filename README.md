# ImageFlux - 3D沉浸式图片预览系统

ImageFlux 是一个基于 **Spring Boot** 和 **原生 Web 3D 技术** 构建的高性能本地图片预览系统。它不仅提供了传统后端的图片托管能力，还在前端实现了极其流畅的 3D 轮盘（Ring）与封面流（Coverflow）交互体验，并集成了现代浏览器的高级特性。

## ✨ 核心特性

- **🌊 沉浸式 3D 交互**：纯 CSS3D 与原生 JavaScript 驱动的 3D 轮盘和折叠画廊，支持鼠标拖拽、滚轮切换及平滑动画。
- **📁 零上传本地直连**：集成前沿的 `File System Access API`，允许用户直接通过浏览器授权读取本地文件夹，无需将大量图片上传至服务器。
- **⚡ 极致性能优化**：
  - **动态优化器 (`image-optimizer.js`)**：内置 Canvas 动态压缩、预加载队列管理和按需懒加载。
  - **性能监控面板 (`performance-monitor.js`)**：实时监控帧率 (FPS)、内存占用 (JS Heap) 和渲染延迟（按 `P` 键开启）。
- **🔐 基础安全防护**：内置 Spring Security 表单登录，支持拟物化（Glassmorphism）和赛博朋克粒子特效的炫酷登录界面。
- **🎬 影院级查看器**：点击图片即可进入全屏“影院模式”，支持无极缩放和拖拽平移。

## 🛠 技术栈

### 后端
- **核心框架**：Java 11, Spring Boot 2.7.15
- **安全认证**：Spring Security (基于内存的快速认证)
- **模板引擎**：Thymeleaf

### 前端
- **UI 渲染**：HTML5, CSS3 (3D Transforms, Backdrop-filter 玻璃拟态)
- **脚本逻辑**：Vanilla JavaScript (原生 JS，零第三方 UI 库依赖)
- **视觉规范**：遵循 `UI_SPECIFICATION.md` 制定的深色极简风格。

## 🚀 快速开始

### 1. 环境准备
- JDK 11 或更高版本
- Maven 3.x

### 2. 启动项目
在项目根目录下执行以下命令打包并运行：

```bash
mvn clean package
java -jar target/image-preview-1.0-SNAPSHOT.jar
```
或者直接在 IDE (如 IntelliJ IDEA) 中运行 `ImagePreviewApplication.java`。

### 3. 访问系统
- 打开浏览器访问：`http://localhost:8080`
- **默认测试账号**：
  - 用户名：`admin`
  - 密码：`123456`
  *(定义于 `SecurityConfig.java`)*

## ⚙️ 配置说明

您可以在 `src/main/resources/application.properties` 中修改核心配置：

```properties
# 更改服务器端口
server.port=8080

# 更改默认读取的本地图片目录 (默认读取项目根目录下的 images 文件夹)
image.directory=${user.dir}/images
```
*提示：如果使用默认配置，请确保在项目根目录（`pom.xml` 同级）下创建一个 `images` 文件夹，并放入几张测试图片。*

## 👁️ 视图模式说明

系统会根据用户选择的图片数量和路径，智能切换不同的展现形态：

1. **直接文件夹选择 (`/direct-select-folder`)**：调用系统文件管理器，浏览器直接授权渲染，保护隐私。
2. **3D 轮盘模式 (`/gallery-from-files`)**：当所选图片数 **≤ 8 张** 时自动激活，以环形 3D 阵列展示。
3. **沉浸式画廊 (`/immersive-gallery`)**：当图片数量较多时激活，类似 Apple 的 Coverflow 封面流体验。

## ⌨️ 快捷键指南

- `Esc`：退出影院级图片查看模式
- `←` / `→` (方向键)：在画廊中切换上一张/下一张图片
- `Space` / `Enter`：同向右切换
- `P`：**【开发者专享】** 呼出/隐藏右上角性能监控悬浮窗 (FPS & 内存监控)

---

**ImageFlux** - 让每一张图片的展示都充满秩序与美感。

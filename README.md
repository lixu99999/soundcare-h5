# SoundCare H5

SoundCare 的**纯 H5 前端**（Vue 3 + TypeScript + Vite）。从微信小程序 [`soundcare-app/`](../soundcare-app) 改写，部署在 `https://soundcare.collegegenerator.cn`。

## 与小程序/App 的区别

| 维度 | 微信小程序 (uniapp) | H5 (本仓库) |
|------|--------------------|------------|
| 框架 | Vue 3 + JS | Vue 3 + TypeScript |
| UI 元素 | `<view>` / `<text>` | `<div>` / `<span>` |
| 路由 | uniapp pages.json | vue-router history mode |
| 数据持久化 | `uni.setStorageSync` | `localStorage` |
| 音频 | `uni.createInnerAudioContext` | HTML5 `<audio>` |
| 单位 | rpx (编译时转) | SCSS `rpx()` 函数 → vw |
| 平台 API | uni.* | 浏览器原生 |

## 5 个页面

| 路由 | 源文件 | 说明 |
|------|--------|------|
| `/` | `HomeView.vue` | 首页：时段问候 + HRV mock + 5 场景网格 + AI 输入框 |
| `/generate` | `GenerateView.vue` | 手动生成：参数面板 + 推荐 + 调用 `/music/generate` |
| `/ai-generate` | `AiGenerateView.vue` | AI 优化后的 prompt 展示 + 生成按钮 |
| `/player` | `PlayerView.vue` | 播放页：黑胶 + HTML5 audio + HRV 曲线 |
| `/profile` | `ProfileView.vue` | 个人中心：用户信息 + 偏好 + 设备 + 历史（静态 mock） |

## 本地开发

```bash
# 安装依赖
npm install

# 启动 dev server（默认 http://localhost:5173）
npm run dev

# 类型检查 + 生产构建
npm run build

# 本地预览生产产物
npm run preview
```

`vite.config.ts` 已配置：
- `/api/*` 代理到 `http://localhost:8002`（后端本地端口）
- 监听 `0.0.0.0:5173`（局域网扫码测试）

```bash
# 让另一台电脑/手机访问你的 dev server：
# http://<你的局域网IP>:5173
```

### 后端要求

本地启动 `soundcare-backend`：

```bash
cd ../soundcare-backend
source ~/code/t/soundcare/.venv/bin/activate  # 或你自己的 venv
uvicorn app.main:app --host 127.0.0.1 --port 8002
```

## API 配置

默认通过 vite proxy 访问 `/api/v1/*` → `http://localhost:8002`。

生产环境通过环境变量 `VITE_API_BASE_URL` 覆盖，build 时嵌入：

```bash
VITE_API_BASE_URL=https://api.collegegenerator.cn/api/v1 npm run build
```

不设置则默认用 `/api/v1`（依赖 nginx 转发）。

## 生产部署

```bash
# 1. 构建
npm run build  # 产物在 dist/

# 2. rsync 到 ECS
rsync -avz --delete dist/ root@39.106.146.12:/var/www/soundcare-h5/dist/

# 3. nginx 已配 (soundcare.conf)，但首次部署要补：
#    location / { try_files $uri $uri/ /index.html; }  # SPA fallback
```

详见 `workspace_doc/SoundCare_域名证书部署记录.md`。

## 项目结构

```
soundcare-h5/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/          # axios 封装
│   ├── views/        # 5 个页面
│   ├── stores/       # Pinia: music + hrv
│   ├── utils/        # hrv / time / translate / storage
│   ├── types/        # TS 接口
│   ├── styles/       # SCSS tokens
│   ├── router/       # vue-router
│   ├── App.vue
│   └── main.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 已知限制

- **HRV 是 mock 数据**：H5 调不到 Apple Watch / 华为手表，每 5 秒模拟一次
- **浏览器 autoplay 限制**：`<audio>` 必须在用户点击后才能播放（play/pause 按钮触发）
- **localStorage 隔离**：每个 origin 独立，跨域无共享
- **未做限流**：公网部署后任何人能调 `/music/generate` 烧 LLM/Suno 额度；建议后端加 slowapi
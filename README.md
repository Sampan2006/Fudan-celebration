# 复旦大学120周年校庆网站

## 项目简介
本项目是为庆祝复旦大学建校120周年而开发的互动性网站，旨在展示复旦大学的历史沿革、重要成就，并提供一个让复旦人分享祝福和回忆的平台。

## 网站访问
🌐 在线访问地址：[复旦120周年校庆网站](https://sampan2006.github.io/Fudan-celebration/)

## 功能特点

### 1. 首页
- 校庆主题展示
- 校歌背景音乐自动播放
- 响应式设计，适配各种设备

### 2. 历史时间轴
- 复旦大学重要历史事件展示
- 交互式时间轴设计
- 图文并茂的历史记录

### 3. 祝福墙
- 实时发布祝福功能
- 弹幕式祝福展示
- 点赞和分享功能
- 标签分类系统
- 时间轴式布局展示
- 背景音乐播放控制

### 4. 成就展示
- 学校重要成就展示
- 分类浏览功能
- 详细信息展示

## 技术栈
- 前端：HTML5, CSS3, JavaScript (原生)
- 样式：响应式设计，Flexbox/Grid布局
- 动画：CSS3 动画，JavaScript 动画
- 音频控制：HTML5 Audio API
- 图标：Font Awesome 6.0

## 特色功能

### 音频控制系统
- 支持自动播放（需用户交互）
- 音量渐入渐出效果
- 页面切换音乐持续播放
- 不同页面不同背景音乐

### 交互设计
- 流畅的动画效果
- 直观的用户界面
- 友好的移动端适配
- 即时反馈机制

### 数据管理
- 本地存储用户偏好
- 点赞数据持久化
- 用户状态管理

## 项目结构
```
project/
│
├── index.html          // 首页
├── directory.html      // 内容目录
├── timeline.html       // 历史时间轴
├── wishes.html         // 祝福墙
├── achievements.html   // 成就展示
│
├── css/
│   └── style.css      // 主样式文件
│
├── js/
│   └── audio-controller.js  // 音频控制器
│
├── assets/
│   ├── audio/         // 音频文件
│   └── images/        // 图片资源
│
└── README.md          // 项目文档
```

## 安装和使用
1. 克隆项目到本地
2. 确保所有资源文件（图片、音频等）都在正确的目录下
3. 使用现代浏览器打开 index.html 即可运行

## 浏览器支持
- Chrome (推荐)
- Firefox
- Safari
- Edge
- Opera

## 注意事项
1. 音频自动播放需要用户首次交互
2. 部分动画效果在低性能设备上可能会有卡顿
3. 建议使用现代浏览器访问以获得最佳体验

## 未来计划
- [ ] 添加用户登录系统
- [ ] 实现后端数据存储
- [ ] 添加更多互动功能
- [ ] 优化移动端体验
- [ ] 增加多语言支持

## 贡献指南
欢迎为项目提供改进建议和代码贡献。请确保遵循以下步骤：
1. Fork 项目
2. 创建新的分支
3. 提交更改
4. 发起 Pull Request

## 版权信息
© 2024 复旦大学。保留所有权利。 
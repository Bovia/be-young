# 长青伙伴 🌱

适老化的「用药提醒 + 健康陪伴」小程序。用"种树养成"的方式，让老人乐意主动吃药。

> 产品需求与技术决策见 [`CLAUDE.md`](./CLAUDE.md)。

## 技术栈
- **框架**：uni-app（Vue3 + Vite），一套代码可同时编译成**微信小程序**和**网页**。
- **数据**：本地存储为主；已预留**微信云开发 CloudBase** 接入位（见 `src/cloud/cloudbase.js`）。

## 怎么预览（网页版，开发时最快）
```bash
npm install
npm run dev:h5
```
浏览器打开 `http://localhost:5173/`，用浏览器的「手机模式」查看效果最佳。

## 怎么变成真正的微信小程序
```bash
npm run dev:mp-weixin
```
生成的小程序代码在 `dist/dev/mp-weixin/`。用**微信开发者工具**「导入项目」选这个目录，即可在模拟器里看，也能扫码到手机预览。

**首次配置：**
1. 在 `src/manifest.json` 的 `mp-weixin.appid` 填入小程序 AppID
2. 开通云开发后，在 `src/cloud/cloudbase.js` 填入 `CLOUD_ENV_ID`

## 目录结构
```
src/
  pages/
    home/      养成首页（种树 + 今日用药 + 浇水确认 + 夸夸）
    meds/      用药管理（点选添加 / 拍照识别确认卡）
    records/   服药记录 + 未来计划 + 日历浇水提醒同步
    archive/   健康档案（化验单/体检报告拍照归档）
    settings/  设置（称呼 / 老人模式 / 养成数据 / 云端状态）
  components/
    app-tabbar/  自定义底部导航（老人模式 2 标签 / 普通 5 标签）
  store/
    store.js   本地数据与养成逻辑
  cloud/
    cloudbase.js  云开发接入层（预留）
  utils/
    calendar.js   日历浇水提醒生成与同步
```

## 当前进度
- [x] 养成首页：种树、按时段分组、防误触、夸夸、震动反馈
- [x] 用药管理：点选表单、长/短期周期、未来 7 天计划
- [x] 日历同步：浇水文案提醒（微信小程序真机；适合长期稳定用药）
- [x] 健康档案：拍照存本地、按日期归档
- [x] 老人模式：底部仅「我的树 + 记录」，设置从记录页进入
- [x] 云开发脚手架（待填环境 ID）
- [ ] 真正的拍照 OCR 识别
- [ ] 微信订阅消息提醒

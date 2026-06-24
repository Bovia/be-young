<script>
import { persist } from './store/store.js'
import { initCloud } from './cloud/cloudbase.js'

export default {
  onLaunch: function () {
    initCloud()
  },
  onHide: function () {
    persist()
  }
}
</script>

<style>
/* —— Apple 风格 · 适老化大字 —— */
page {
  --primary: #007aff;
  --primary-dark: #0051d5;
  --primary-soft: rgba(0, 122, 255, 0.12);
  --accent-green: #34c759;
  --accent-green-soft: rgba(52, 199, 89, 0.14);
  --bg: #f2f2f7;
  --card: #ffffff;
  --fill: #e5e5ea;
  --fill-secondary: #f2f2f7;
  --text: #000000;
  --text-sub: #8e8e93;
  --text-secondary: #3c3c43;
  --separator: rgba(60, 60, 67, 0.12);
  --warn: #ff9500;
  --warn-soft: rgba(255, 149, 0, 0.14);
  --danger: #ff3b30;
  --danger-soft: rgba(255, 59, 48, 0.12);
  --radius-sm: 16rpx;
  --radius-md: 24rpx;
  --radius-lg: 32rpx;
  --gap-section: 32rpx;

  background-color: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'PingFang SC', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}

.page {
  min-height: 100vh;
  padding: 0 32rpx;
  box-sizing: border-box;
}

.page-title {
  font-size: 68rpx;
  font-weight: 700;
  letter-spacing: -0.5rpx;
  color: var(--text);
  line-height: 1.1;
}

.page-sub {
  font-size: 30rpx;
  color: var(--text-sub);
  margin-top: 8rpx;
  line-height: 1.4;
}

.card {
  background: var(--card);
  border-radius: var(--radius-md);
  padding: 28rpx 32rpx;
}

.inset-group {
  background: var(--card);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: var(--gap-section);
}

.section-label {
  font-size: 26rpx;
  color: var(--text-sub);
  text-transform: uppercase;
  letter-spacing: 1rpx;
  margin: 8rpx 8rpx 12rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 34rpx;
  font-weight: 600;
  line-height: 1.2;
  border: none;
}
.btn::after { border: none; }

.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:active { opacity: 0.82; }

.btn-warn {
  background: var(--warn);
  color: #fff;
}
.btn-warn:active { opacity: 0.82; }

.btn-ghost {
  background: var(--fill);
  color: var(--primary);
}

.row { display: flex; align-items: center; }
.spacer { flex: 1; }

.page-with-tabbar {
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}
</style>

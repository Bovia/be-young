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
/* —— 全局公共样式（活力绿 · 大字 · 大按钮）—— */
page {
  --primary: #2e9e5b;
  --primary-dark: #1f7d45;
  --primary-soft: #e6f3ea;
  --bg: #eef1ea;
  --card: #ffffff;
  --text: #2b3a2f;
  --text-sub: #7d8a7f;
  --warn: #f0a020;
  background-color: var(--bg);
  color: var(--text);
  font-family: -apple-system, "PingFang SC", "Helvetica Neue", Helvetica, sans-serif;
}

.page {
  min-height: 100vh;
  padding: 0 32rpx;
  box-sizing: border-box;
}

.page-title {
  font-size: 52rpx;
  font-weight: 800;
  color: var(--text);
}

.page-sub {
  font-size: 28rpx;
  color: var(--text-sub);
  margin-top: 6rpx;
}

.card {
  background: var(--card);
  border-radius: 28rpx;
  padding: 32rpx;
  box-shadow: 0 6rpx 24rpx rgba(46, 158, 91, 0.06);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.2;
  border: none;
}
.btn::after { border: none; }

.btn-primary {
  background: var(--primary);
  color: #fff;
}
.btn-primary:active { background: var(--primary-dark); }

.btn-warn {
  background: var(--warn);
  color: #fff;
}

.btn-ghost {
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.row { display: flex; align-items: center; }
.spacer { flex: 1; }

.page-with-tabbar {
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}
</style>

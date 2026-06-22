/**
 * 微信云开发（CloudBase）接入层
 *
 * 使用前请在 manifest.json → mp-weixin 填入 appid，
 * 并在微信开发者工具里开通云开发、把环境 ID 填到 CLOUD_ENV_ID。
 */

// TODO: 开通云开发后，把环境 ID 填在这里
export const CLOUD_ENV_ID = ''

let inited = false

export function isCloudReady() {
  // #ifdef MP-WEIXIN
  return inited && !!CLOUD_ENV_ID && typeof wx !== 'undefined' && !!wx.cloud
  // #endif
  return false
}

export function initCloud() {
  // #ifdef MP-WEIXIN
  if (inited || !CLOUD_ENV_ID) return false
  try {
    wx.cloud.init({ env: CLOUD_ENV_ID, traceUser: true })
    inited = true
    return true
  } catch (e) {
    console.warn('[cloud] init failed', e)
    return false
  }
  // #endif
  return false
}

/** 从云端拉取用户数据（未配置时返回 null，继续用本地） */
export async function pullUserData(openid) {
  if (!isCloudReady() || !openid) return null
  try {
    const db = wx.cloud.database()
    const res = await db.collection('users').doc(openid).get()
    return res.data || null
  } catch (e) {
    return null
  }
}

/** 保存用户数据到云端 */
export async function pushUserData(openid, data) {
  if (!isCloudReady() || !openid) return false
  try {
    const db = wx.cloud.database()
    await db.collection('users').doc(openid).set({
      data: { ...data, updatedAt: Date.now() }
    })
    return true
  } catch (e) {
    console.warn('[cloud] push failed', e)
    return false
  }
}

/** 上传档案照片到云存储 */
export async function uploadArchiveImage(localPath) {
  if (!isCloudReady()) return localPath
  try {
    const ext = localPath.split('.').pop() || 'jpg'
    const cloudPath = `archives/${Date.now()}.${ext}`
    const res = await wx.cloud.uploadFile({ cloudPath, filePath: localPath })
    return res.fileID
  } catch (e) {
    return localPath
  }
}

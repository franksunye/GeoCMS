/**
 * Media API 测试
 *
 * 运行方式：
 * 1. 启动开发服务器：npm run dev
 * 2. 在浏览器控制台或使用 curl 测试以下端点
 *
 * 测试用例：
 */

// Test 1: 获取媒体列表
// curl http://localhost:3000/api/media
// 预期：返回 200，包含 data 数组和 total 数字

// Test 2: 按类型筛选
// curl http://localhost:3000/api/media?type=image
// 预期：返回 200，所有项的 type 都是 'image'

// Test 3: 搜索媒体
// curl http://localhost:3000/api/media?search=product
// 预期：返回 200，包含匹配的媒体

// Test 4: 获取单个媒体
// curl http://localhost:3000/api/media/1
// 预期：返回 200，包含 id 为 1 的媒体

// Test 5: 获取不存在的媒体
// curl http://localhost:3000/api/media/99999
// 预期：返回 404

export const mediaTests = {
  testFetchList: 'GET /api/media',
  testFilterByType: 'GET /api/media?type=image',
  testSearch: 'GET /api/media?search=product',
  testGetSingle: 'GET /api/media/1',
  testNotFound: 'GET /api/media/99999',
}


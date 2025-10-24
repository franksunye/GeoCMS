/**
 * Templates API 测试
 *
 * 运行方式：
 * 1. 启动开发服务器：npm run dev
 * 2. 在浏览器控制台或使用 curl 测试以下端点
 *
 * 测试用例：
 */

// Test 1: 获取模板列表
// curl http://localhost:3000/api/templates
// 预期：返回 200，包含 data 数组、total 数字、categories 数组

// Test 2: 按分类筛选
// curl http://localhost:3000/api/templates?category=blog
// 预期：返回 200，所有项的 category 都是 'blog'

// Test 3: 搜索模板
// curl http://localhost:3000/api/templates?search=blog
// 预期：返回 200，包含匹配的模板

// Test 4: 获取单个模板
// curl http://localhost:3000/api/templates/1
// 预期：返回 200，包含 id 为 1 的模板，包含 structure 对象

// Test 5: 获取不存在的模板
// curl http://localhost:3000/api/templates/99999
// 预期：返回 404

// Test 6: 验证模板结构
// curl http://localhost:3000/api/templates/1
// 预期：返回 200，包含所有必需字段

// Test 7: 验证排序
// curl http://localhost:3000/api/templates
// 预期：返回 200，按 usage_count 降序排列

export const templateTests = {
  testFetchList: 'GET /api/templates',
  testFilterByCategory: 'GET /api/templates?category=blog',
  testSearch: 'GET /api/templates?search=blog',
  testGetSingle: 'GET /api/templates/1',
  testNotFound: 'GET /api/templates/99999',
  testStructure: 'GET /api/templates/1',
  testSorting: 'GET /api/templates',
}


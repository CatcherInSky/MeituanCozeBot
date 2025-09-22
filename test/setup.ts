// Jest测试环境配置
import 'jest';

// 全局测试配置
beforeAll(() => {
  // 设置测试环境的时区为中国时区
  process.env.TZ = 'Asia/Shanghai';
});

// 每个测试前的清理工作
beforeEach(() => {
  // 清除所有模拟和spy
  jest.clearAllMocks();
});
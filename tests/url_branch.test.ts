// url_branch.ts 的测试用例
import main, { extractFileName, detectPaymentChannel } from '../../script/url_branch';
import { urlTestData } from './testData';

describe('url_branch.ts - URL分支检测', () => {
  describe('extractFileName 函数', () => {
    test('应该正确提取文件名', () => {
      const url = 'https://example.com/download?x-wf-file_name=微信支付账单_2025-09-08.xlsx';
      const fileName = extractFileName(url);
      expect(fileName).toBe('微信支付账单_2025-09-08.xlsx');
    });

    test('应该处理URL编码的文件名', () => {
      const url = 'https://example.com/download?x-wf-file_name=%E5%BE%AE%E4%BF%A1%E6%94%AF%E4%BB%98%E8%B4%A6%E5%8D%95_2025-09-08.xlsx';
      const fileName = extractFileName(url);
      expect(fileName).toBe('微信支付账单_2025-09-08.xlsx');
    });

    test('应该处理没有x-wf-file_name参数的URL', () => {
      const url = 'https://example.com/download?other=param';
      const fileName = extractFileName(url);
      expect(fileName).toBe('');
    });

    test('应该处理无效的URL', () => {
      const url = 'not-a-url';
      const fileName = extractFileName(url);
      expect(fileName).toBe('');
    });
  });

  describe('detectPaymentChannel 函数', () => {
    test('应该正确识别微信支付', () => {
      const fileName = '微信支付账单_2025-09-08.xlsx';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('微信支付');
    });

    test('应该正确识别招商银行储蓄卡', () => {
      const fileName = '招商银行交易流水_2024-09-06.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('招商银行储蓄卡');
    });

    test('应该正确识别招商银行信用卡', () => {
      const fileName = '招商银行信用卡账单_2024年9月.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('招商银行信用卡');
    });

    test('应该正确识别支付宝', () => {
      const fileName = '支付宝账单_2025-09-08.xlsx';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('支付宝');
    });

    test('应该处理未知文件名', () => {
      const fileName = 'unknown_file.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('');
    });

    test('应该处理空文件名', () => {
      const fileName = '';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('');
    });

    test('应该处理大小写不敏感', () => {
      const fileName = 'WECHAT_PAY_BILL.xlsx';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('微信支付');
    });
  });

  describe('main 函数', () => {
    test.each(urlTestData)('应该正确检测支付渠道: $input', async ({ input, expected }) => {
      const result = await main({ params: { input } });
      expect(result.output).toBe(expected);
    });

    test('应该处理空URL', async () => {
      const result = await main({ params: { input: '' } });
      expect(result.output).toBe('');
    });

    test('应该处理null输入', async () => {
      const result = await main({ params: { input: null as any } });
      expect(result.output).toBe('');
    });
  });

  describe('边界情况测试', () => {
    test('应该处理特殊字符', () => {
      const fileName = '微信支付账单_2025-09-08_特殊字符!@#.xlsx';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('微信支付');
    });

    test('应该处理长文件名', () => {
      const fileName = 'very_long_wechat_payment_bill_file_name_with_many_characters_2025-09-08.xlsx';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('微信支付');
    });

    test('应该处理包含多个关键词的文件名', () => {
      const fileName = '招商银行信用卡储蓄卡账单.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('招商银行储蓄卡'); // 储蓄卡优先级更高
    });
  });
});

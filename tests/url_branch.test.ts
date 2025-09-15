// url_branch.ts 的测试用例
import main, { extractFileName, detectPaymentChannel } from '../script/url_branch';
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

  describe('压缩包重复解压和复制粘贴场景测试', () => {
    test('应该处理压缩包重复解压的文件名', () => {
      const fileName = '招商银行交易流水(申请时间2025年09月08日19时15分51秒) 2.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('招商银行储蓄卡');
    });

    test('应该处理复制粘贴的文件名', () => {
      const fileName = '微信支付账单_2025-09-08 (2).xlsx';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('微信支付');
    });

    test('应该处理副本文件名的场景', () => {
      const fileName = '支付宝账单_2025-09-08 副本.csv';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('支付宝');
    });

    test('应该处理多个重复标识的文件名', () => {
      const fileName = '招商银行信用卡账单_2024年9月 (2) 副本.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('招商银行信用卡');
    });

    test('应该处理文件名末尾的数字标识', () => {
      const fileName = '广发银行信用卡账单 3.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('广发银行信用卡');
    });
  });

  describe('URL编码和特殊字符测试', () => {
    test('应该处理URL编码的中文文件名', () => {
      const url = 'https://example.com/download?x-wf-file_name=%E5%BE%AE%E4%BF%A1%E6%94%AF%E4%BB%98%E8%B4%A6%E5%8D%95_2025-09-08.xlsx';
      const fileName = extractFileName(url);
      expect(fileName).toBe('微信支付账单_2025-09-08.xlsx');
    });

    test('应该处理包含空格的URL编码文件名', () => {
      const url = 'https://example.com/download?x-wf-file_name=%E6%8B%9B%E5%95%86%E9%93%B6%E8%A1%8C%20%E4%BA%A4%E6%98%93%E6%B5%81%E6%B0%B4.pdf';
      const fileName = extractFileName(url);
      expect(fileName).toBe('招商银行 交易流水.pdf');
    });

    test('应该处理包含特殊符号的URL编码文件名', () => {
      const url = 'https://example.com/download?x-wf-file_name=%E6%8B%9B%E5%95%86%E9%93%B6%E8%A1%8C%E4%BF%A1%E7%94%A8%E5%8D%A1%E8%B4%A6%E5%8D%95%282024%E5%B9%B49%E6%9C%88%29.pdf';
      const fileName = extractFileName(url);
      expect(fileName).toBe('招商银行信用卡账单(2024年9月).pdf');
    });
  });

  describe('文件名优先级和冲突处理测试', () => {
    test('应该正确处理招商银行储蓄卡和信用卡的优先级', () => {
      const fileName = '招商银行储蓄卡信用卡账单.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('招商银行储蓄卡'); // 储蓄卡优先级更高
    });

    test('应该正确处理包含信用卡账单关键词的文件名', () => {
      const fileName = '招商银行信用卡账单_2024年9月.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('招商银行信用卡');
    });

    test('应该正确处理广发银行信用卡的特殊关键词', () => {
      const fileName = '2024年02月综合对账单打印版.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('广发银行信用卡');
    });

    test('应该处理不包含特殊关键词的招商银行文件', () => {
      const fileName = '招商银行交易流水_2024-09-06.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('招商银行储蓄卡'); // 默认储蓄卡
    });
  });

  describe('异常和边界情况测试', () => {
    test('应该处理只有扩展名的文件名', () => {
      const fileName = '.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('');
    });

    test('应该处理只有数字的文件名', () => {
      const fileName = '123456.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('');
    });

    test('应该处理包含null字符的文件名', () => {
      const fileName = '微信支付账单\0.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('微信支付');
    });

    test('应该处理超长文件名', () => {
      const fileName = 'a'.repeat(1000) + '微信支付' + 'b'.repeat(1000) + '.pdf';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('微信支付');
    });

    test('应该处理包含emoji的文件名', () => {
      const fileName = '微信支付账单📊💰_2025-09-08.xlsx';
      const channel = detectPaymentChannel(fileName);
      expect(channel).toBe('微信支付');
    });
  });
});

import main from '../../script/channel/gf_creditcard_file_process';
import { gfCreditCardRawInputData } from '../testData';

describe('gf_creditcard_file_process.ts - 广发银行信用卡数据处理', () => {
  test('应该正确解析广发银行信用卡原始数据', async () => {
    const result = await main({
      params: { input: gfCreditCardRawInputData }
    });

    console.log('解析到的数据条数:', result.output.data.length);
    console.log('前3条数据:');
    result.output.data.slice(0, 3).forEach((item, index) => {
      console.log(`${index + 1}. ${item.交易日期} ${item.交易摘要} ${item.交易金额}`);
    });
    console.log('最后3条数据:');
    result.output.data.slice(-3).forEach((item, index) => {
      console.log(`${result.output.data.length - 2 + index}. ${item.交易日期} ${item.交易摘要} ${item.交易金额}`);
    });

    expect(result.output.channel).toBe('广发银行信用卡');
    expect(result.output.date).toHaveLength(2);
    expect(result.output.date[0]).toBe('2024-01-28 00:00:00');
    expect(result.output.date[1]).toBe('2024-02-27 23:59:59');
    expect(result.output.data.length).toBeGreaterThan(0);
    
    // 检查交易记录格式
    const firstTransaction = result.output.data[0];
    expect(firstTransaction).toHaveProperty('交易日期');
    expect(firstTransaction).toHaveProperty('入账日期');
    expect(firstTransaction).toHaveProperty('交易摘要');
    expect(firstTransaction).toHaveProperty('交易金额');
    expect(firstTransaction).toHaveProperty('交易货币');
    expect(firstTransaction).toHaveProperty('入账金额');
    expect(firstTransaction).toHaveProperty('入账货币');
    expect(firstTransaction.数据来源).toBe('广发银行信用卡');
    
    // 检查具体交易数据
    expect(firstTransaction.交易日期).toBe('2024/02/25');
    expect(firstTransaction.入账日期).toBe('2024/02/26');
    expect(firstTransaction.交易摘要).toContain('(消费)拼多多支付-拼多多平台商户');
    expect(firstTransaction.交易金额).toBe('8.49');
    expect(firstTransaction.交易货币).toBe('人民币');
    expect(firstTransaction.入账金额).toBe('8.49');
    expect(firstTransaction.入账货币).toBe('人民币');
  });

  test('应该处理缺少边界标识的数据', async () => {
    const incompleteData = `
    信用卡账户信息
    账单周期2024/01/28 - 2024/02/27个人消费额度30,000.00
    交易明细
    用卡安全温馨提示：
    `;

    const result = await main({
      params: { input: incompleteData }
    });

    expect(result.output.channel).toBe('广发银行信用卡');
    expect(result.output.date).toHaveLength(2);
    expect(result.output.data).toHaveLength(0);
  });

  test('应该处理空输入', async () => {
    const result = await main({
      params: { input: '' }
    });

    expect(result.output.channel).toBe('广发银行信用卡');
    expect(result.output.date).toHaveLength(0);
    expect(result.output.data).toHaveLength(0);
  });

  test('应该正确处理多页数据', async () => {
    const multiPageData = `
客户星级
 ★★★
 信用卡账户信息
账单周期2024/01/28 - 2024/02/27个人消费额度30,000.00
卡号末四位本期账单金额最低还款额最后还款日入账货币存款卡片消费额度
12343,100.18156.002024/03/16人民币0.0030,000.00
注：若您名下的多张信用卡主卡均有欠款，需分别还款。
交易日期入账日期交易摘要交易金额交易货币入账金额入账货币
 交易明细
 卡号：6251********1234
2024/02/252024/02/26
(消费)拼多多支付-拼多多平台商户
8.49 人民币8.49 人民币
2024/02/252024/02/26
(退货)拼多多支付-拼多多平台商户
-10.06人民币-10.06人民币
1/3
交易日期入账日期交易摘要交易金额交易货币入账金额入账货币
2024/02/242024/02/24
(消费)财付通-测试咖啡店有限公司
36.00 人民币36.00 人民币
2024/02/242024/02/25
(消费)支付宝-测试用户A
39.90 人民币39.90 人民币
2/3
交易日期入账日期交易摘要交易金额交易货币入账金额入账货币
2024/02/222024/02/23
(退货)（特约）美团
-2.49 人民币-2.49 人民币
2024/02/222024/02/23
(消费)（特约）美团
2.30 人民币2.30 人民币
3/3
用卡安全温馨提示：
银行仅通过官方渠道为客户提供包括解除卡片冻结、办理退款退货等服务
`;

    const result = await main({
      params: { input: multiPageData }
    });

    expect(result.output.channel).toBe('广发银行信用卡');
    expect(result.output.date).toHaveLength(2);
    expect(result.output.date[0]).toBe('2024-01-28 00:00:00');
    expect(result.output.date[1]).toBe('2024-02-27 23:59:59');
    
    // 应该解析到所有页面的数据，不仅仅是最后一页
    expect(result.output.data.length).toBe(6); // 总共6条交易记录（2页，每页3条）
    
    // 验证解析到的数据（按实际顺序）
    expect(result.output.data[0].交易日期).toBe('2024/02/25');
    expect(result.output.data[0].交易摘要).toContain('(消费)拼多多支付-拼多多平台商户');
    expect(result.output.data[0].交易金额).toBe('8.49');

    expect(result.output.data[1].交易日期).toBe('2024/02/25');
    expect(result.output.data[1].交易摘要).toContain('(退货)拼多多支付-拼多多平台商户');
    expect(result.output.data[1].交易金额).toBe('-10.06');

    expect(result.output.data[2].交易日期).toBe('2024/02/24');
    expect(result.output.data[2].交易摘要).toContain('(消费)财付通-测试咖啡店有限公司');
    expect(result.output.data[2].交易金额).toBe('36.00');

    expect(result.output.data[3].交易日期).toBe('2024/02/24');
    expect(result.output.data[3].交易摘要).toContain('(消费)支付宝-测试用户A');
    expect(result.output.data[3].交易金额).toBe('39.90');

    expect(result.output.data[4].交易日期).toBe('2024/02/22');
    expect(result.output.data[4].交易摘要).toContain('(退货)（特约）美团');
    expect(result.output.data[4].交易金额).toBe('-2.49');

    expect(result.output.data[5].交易日期).toBe('2024/02/22');
    expect(result.output.data[5].交易摘要).toContain('(消费)（特约）美团');
    expect(result.output.data[5].交易金额).toBe('2.30');
  });
});

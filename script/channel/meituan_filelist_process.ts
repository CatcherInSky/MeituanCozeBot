// Demo数据已移至测试用例中
import { MeituanOrder, MeituanProcessOutput, FunctionArgs } from '../../types';
type Args = FunctionArgs<{ input: string[] }>;
type Output = MeituanProcessOutput;

import dayjs from 'dayjs';

// 去重 格式化 排序 转义 - 优化版本，减少循环次数
async function main({ params }: Args): Promise<Output> {
  const { input } = params;

  // 用于去重的Map，键为交易单号，值为清理后的交易数据
  const uniqueTransactions = new Map<string, any>();
  const timePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

  // 单次循环完成：解析JSON、提取交易记录、去重、数据清理
  for (const jsonString of input) {
    try {
      const parsed = JSON.parse(jsonString);
      const items = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of items) {
        // 获取所有键名，包括可能包含BOM字符的键
        const keys = Object.keys(item);
        const meituanKey = keys.find(key => key.includes('美团交易账单明细'));

        // 查找包含交易数据的对象 - 同时有美团交易账单明细和null字段
        if (
          meituanKey &&
          item[meituanKey] &&
          item.null &&
          Array.isArray(item.null) &&
          item.null.length >= 10
        ) {
          const content = item[meituanKey];
          const transactionData = item.null;

          // 跳过标题行
          if (content === '交易创建时间') {
            continue;
          }

          // 检查是否包含有效的交易时间
          const hasValidCreateTime = timePattern.test(content);
          const hasValidSuccessTime = timePattern.test(transactionData[0]);

          if (hasValidCreateTime && hasValidSuccessTime) {
            // 创建交易记录并立即进行数据清理
            const cleanedTransaction = {
              交易创建时间: content.replace(/\\t/g, '').trim(),
              交易成功时间: transactionData[0].replace(/\\t/g, '').trim(),
              交易类型: transactionData[1].replace(/\\t/g, '').trim(),
              订单标题: transactionData[2].replace(/\\t/g, '').trim(),
              '收/支': transactionData[3].replace(/\\t/g, '').trim(),
              支付方式: transactionData[4].replace(/\\t/g, '').trim(),
              订单金额: transactionData[5].replace(/\\t/g, '').trim(),
              实付金额: transactionData[6].replace(/\\t/g, '').trim(),
              交易单号: transactionData[7].replace(/\\t/g, '').trim(),
              商家单号: transactionData[8].replace(/\\t/g, '').trim(),
              备注: (transactionData[9] || '/').replace(/\\t/g, '').trim(),
            };

            // 以交易单号为基准进行去重（只保留第一个）
            const transactionId = cleanedTransaction.交易单号;
            if (!uniqueTransactions.has(transactionId)) {
              uniqueTransactions.set(transactionId, cleanedTransaction);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse JSON string:', jsonString);
    }
  }

  // 按交易成功时间排序并过滤退款数据
  const output = Array.from(uniqueTransactions.values())
    .sort((a, b) => {
      const timeA = dayjs(a.交易成功时间);
      const timeB = dayjs(b.交易成功时间);
      return timeA.isBefore(timeB) ? -1 : timeA.isAfter(timeB) ? 1 : 0;
    })
    .filter(item => item.交易类型 === '退款');

  return { output };
}

export default main;


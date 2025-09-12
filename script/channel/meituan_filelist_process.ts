// demo数据，由多个csv解析

const demo = {
  input: [
    '[{"﻿美团交易账单明细":"美团用户名：[]"},{"﻿美团交易账单明细":"起始时间：[2025-03-08] 终止时间：[2025-06-08]"},{"﻿美团交易账单明细":"导出交易类型：[全部]"},{"﻿美团交易账单明细":"导出时间：[2025-09-08 12:09:25]"},{"﻿美团交易账单明细":""},{"﻿美团交易账单明细":"共：15笔记录"},{"﻿美团交易账单明细":"支出：10笔 192.46元"},{"﻿美团交易账单明细":"收入：5笔 53.62元"},{"﻿美团交易账单明细":"不计收支：0笔 0.00元"},{"﻿美团交易账单明细":""},{"﻿美团交易账单明细":"特别提示："},{"﻿美团交易账单明细":"1. 本明细与实际交易结果不符时，以实际交易情况为准"},{"﻿美团交易账单明细":"2. 本明细仅展示当前账单中的交易，不包括已删除的记录"},{"﻿美团交易账单明细":"3. 部分账单记录如充值/提现等交易，不计入为收入或支出类别"},{"﻿美团交易账单明细":"4. 因统计逻辑不同，明细的实付金额累加后可能与统计金额不一致，请以实际交易金额为准"},{"﻿美团交易账单明细":"5. 本明细仅供用户个人对账使用，不具备任何证明效力，禁止用于非法用途"},{"﻿美团交易账单明细":""},{"﻿美团交易账单明细":"【美团交易账单明细列表】"},{"﻿美团交易账单明细":"交易创建时间","null":["交易成功时间","交易类型","订单标题","收/支","支付方式","订单金额","实付金额","交易单号","商家单号","备注"]},{"﻿美团交易账单明细":"2025-06-02 15:08:21","null":["2025-06-02 15:08:27","支付","茉莉奶白 订单详情","支出","招商银行信用卡()","¥16.00","¥16.00","123\\t","123\\t","/"]}]',
  ],
  output: [
    {
      支付方式: "招商银行信用卡",
      实付金额: "¥8.57",
      备注: "/",
      订单标题: "【9.9喝咖啡】美式咖啡/拿铁咖啡2选1",
      交易创建时间: "2025-06-01 07:24:13",
      交易成功时间: "2025-06-01 07:24:13",
      交易类型: "退款",
      "收/支": "收入",
      订单金额: "¥8.57",
      交易单号: "123",
      商家单号: "123",
    },
  ],
};
type Args = { params: { input: string[] } };
type Output = {
  output: {
    支付方式: string;
    实付金额: string;
    备注: string;
    订单标题: string;
    交易创建时间: string;
    交易成功时间: string;
    交易类型: string;
    "收/支": string;
    订单金额: string;
    交易单号: string;
    商家单号: string;
  }[];
};

import dayjs from "dayjs";


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
        if (meituanKey && item[meituanKey] && item.null && Array.isArray(item.null) && item.null.length >= 10) {
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
              "收/支": transactionData[3].replace(/\\t/g, '').trim(),
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

// 调试语句
// await main({ params: demo });
// 微信支付demo数据，由单个xlsx解析出起止日期，还有每条交易流水详情

const demo = {
  input:
    '[{"微信支付账单明细":"微信昵称：[--]","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"起始时间：[2025-06-08 00:00:00] 终止时间：[2025-09-08 23:59:59]","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"导出类型：[全部]","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"导出时间：[2025-09-11 17:43:36]","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":null,"Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"共62笔记录","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"收入：5笔 37元","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"支出：57笔 1.82元","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"中性交易：0笔 0.00元","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"注：","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"1. 充值\\/提现\\/理财通购买\\/零钱通存取\\/信用卡还款等交易，将计入中性交易","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"2. 若交易记录明细无有效内容，则代表该时间段内此微信号无交易。","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"3. 本明细仅供个人对账使用","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":null,"Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"----------------------微信支付账单明细列表--------------------","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"交易时间","Unnamed: 1":"交易类型","Unnamed: 2":"交易对方","Unnamed: 3":"商品","Unnamed: 4":"收\\/支","Unnamed: 5":"金额(元)","Unnamed: 6":"支付方式","Unnamed: 7":"当前状态","Unnamed: 8":"交易单号","Unnamed: 9":"商户单号","Unnamed: 10":"备注"},{"微信支付账单明细":"2025-09-08 15:53:25","Unnamed: 1":"商户消费","Unnamed: 2":"朴朴超市","Unnamed: 3":"朴朴商品订单","Unnamed: 4":"支出","Unnamed: 5":"¥70.56","Unnamed: 6":"招商银行储蓄卡()","Unnamed: 7":"支付成功","Unnamed: 8":"123","Unnamed: 9":"123","Unnamed: 10":"\\/"}]',
  output: {
    channel: '微信支付',
    date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'],
    data: [
      {
        交易时间: '2025-09-08 15:53:25',
        '金额(元)': '¥70.56',
        支付方式: '招商银行储蓄卡()',
        商户单号: '040',
        备注: '/',
        当前状态: '支付成功',
        交易类型: '商户消费',
        交易对方: '朴朴超市',
        商品: '朴朴商品订单',
        '收/支': '支出',
        交易单号: '420000',
      },
    ],
  },
};

type Args = { params: { input: string } };
type Output = {
  output: {
    channel: string;
    date: string[];
    data: {
      交易时间: string;
      '金额(元)': string;
      支付方式: string;
      商户单号: string;
      备注: string;
      当前状态: string;
      交易类型: string;
      交易对方: string;
      商品: string;
      '收/支': string;
      交易单号: string;
      数据来源: string;
    }[];
  };
};

async function main({ params }: Args): Promise<Output> {
  const { input } = params;

  // 解析输入数据
  let parsedData: any[] = [];
  try {
    parsedData = JSON.parse(input);
  } catch (error) {
    console.warn('Failed to parse input JSON:', error);
    return {
      output: {
        channel: '微信支付',
        date: [],
        data: [],
      },
    };
  }

  const transactions: any[] = [];
  let dateRange: string[] = [];

  // 遍历解析后的数据，提取交易记录和日期范围
  for (const item of parsedData) {
    const wechatField = item['微信支付账单明细'];

    // 检查是否包含起始时间和终止时间的行
    if (wechatField && wechatField.includes('起始时间：') && wechatField.includes('终止时间：')) {
      // 使用正则表达式提取起始时间和终止时间
      const startTimeMatch = wechatField.match(/起始时间：\[([^\]]+)\]/);
      const endTimeMatch = wechatField.match(/终止时间：\[([^\]]+)\]/);

      if (startTimeMatch && endTimeMatch) {
        dateRange = [startTimeMatch[1], endTimeMatch[1]];
      }
    }

    // 检查是否包含交易时间（格式：YYYY-MM-DD HH:mm:ss）
    const timePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

    // 跳过标题行、统计信息和空行
    if (
      !wechatField ||
      wechatField.includes('微信昵称') ||
      wechatField.includes('起始时间') ||
      wechatField.includes('导出类型') ||
      wechatField.includes('导出时间') ||
      wechatField.includes('共') ||
      wechatField.includes('收入：') ||
      wechatField.includes('支出：') ||
      wechatField.includes('中性交易：') ||
      wechatField.includes('注：') ||
      wechatField.includes('1.') ||
      wechatField.includes('2.') ||
      wechatField.includes('3.') ||
      wechatField.includes('----------------------') ||
      wechatField === '交易时间' ||
      wechatField === null
    ) {
      continue;
    }

    // 检查是否包含有效的交易时间
    if (timePattern.test(wechatField)) {
      // 提取交易记录，映射字段名
      const transaction = {
        交易时间: wechatField,
        '金额(元)': item['Unnamed: 5'] || '',
        支付方式: item['Unnamed: 6'] || '',
        商户单号: item['Unnamed: 9'] || '',
        备注: item['Unnamed: 10'] || '',
        当前状态: item['Unnamed: 7'] || '',
        交易类型: item['Unnamed: 1'] || '',
        交易对方: item['Unnamed: 2'] || '',
        商品: item['Unnamed: 3'] || '',
        '收/支': item['Unnamed: 4'] || '',
        交易单号: item['Unnamed: 8'] || '',
        数据来源: '微信支付',
      };

      transactions.push(transaction);
    }
  }

  return {
    output: {
      channel: '微信支付',
      date: dateRange,
      data: transactions,
    },
  };
}
// 测试函数
async function testWechatProcess() {
  console.log('=== 微信支付数据处理测试 ===');
  const result = await main({ params: demo });
  console.log('处理结果:');
  console.log(JSON.stringify(result, null, 2));
  console.log('\n渠道:', result.output.channel);
  console.log('日期范围:', result.output.date);
  console.log('数据条数:', result.output.data.length);
}

// 取消注释下面的行来运行测试
// testWechatProcess().catch(console.error);

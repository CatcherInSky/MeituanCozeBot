// 根据文件处理的输出，生成markdown组件使用的字符串
const demo = {
  input: [
    {
      交易创建时间: '2025-03-10 06:59:59',
      支付方式: '招商银行信用卡()',
      实付金额: '¥8.00',
      备注: '/',
      订单标题: '【新品￥8】1份滑蛋乳酪云朵汤种吐司',
      交易成功时间: '2025-03-10 07:00:01',
      交易类型: '退款',
      '收/支': '收入',
      订单金额: '¥8.00',
      交易单号: '2503625',
      商家单号: '498A',
    },
    {
      交易时间: '2025-09-08 15:53:25',
      '金额(元)': '¥70.56',
      支付方式: '招商银行储蓄卡()',
      商户单号: '04001',
      备注: '/',
      当前状态: '支付成功',
      交易类型: '商户消费',
      交易对方: '朴朴超市',
      商品: '朴朴商品订单',
      '收/支': '支出',
      交易单号: '4200',
    },
    {
      余额: '0.00',
      交易摘要: '朝朝宝转出',
      对手信息: '',
      交易日期: '2025-09-06',
      交易金额: '50.05',
      货币: 'CNY',
    },
  ],
};

type Args = {
  params: {
    input: Object[];
    newlineType?: 'natural' | 'unicode' | 'unicode2' | 'unicode3' | 'crlf' | 'lf' | 'cr';
  };
};
type Output = {
  output: string;
};

/**
 * 根据换行类型获取换行符
 * @param newlineType 换行类型
 * @returns 对应的换行符
 */
function getNewlineChar(newlineType: string = 'natural'): string {
  switch (newlineType) {
    case 'natural':
      return '\n'; // 真正的换行符
    case 'unicode':
      return '\u000A'; // Unicode换行符
    case 'unicode2':
      return '\u2028'; // Unicode行分隔符
    case 'unicode3':
      return '\u2029'; // Unicode段落分隔符
    case 'crlf':
      return '\r\n'; // Windows换行符
    case 'lf':
      return '\n'; // Unix换行符
    case 'cr':
      return '\r'; // Mac换行符
    default:
      return '\n';
  }
}

/**
 * 将对象数组转换为markdown表格
 * @param data 对象数组
 * @param newlineType 换行类型
 * @returns markdown表格字符串
 */
function generateMarkdownTable(data: Object[], newlineType: string): string {
  if (!data || data.length === 0) {
    return '暂无数据';
  }

  // 定义列的顺序
  const columnOrder = [
    '交易成功时间',
    '交易创建时间',
    '订单金额',
    '实付金额',
    '订单标题',
    '备注',
    '交易单号',
    '商家单号',
    '交易类型',
    '收/支',
    '支付方式',
  ];

  // 生成表头
  const header = `| ${columnOrder.join(' | ')} |`;

  // 生成分隔线
  const separator = `| ${columnOrder.map(() => '---').join(' | ')} |`;

  // 生成数据行
  const rows = data.map(item => {
    const values = columnOrder.map(key => {
      const value = item[key as keyof typeof item];
      // 处理null、undefined和空值
      if (value === null || value === undefined) {
        return '';
      }
      let processedValue = String(value);
      return processedValue;
    });
    return `| ${values.join(' | ')} |`;
  });

  // 使用指定类型的换行符，避免\n字符
  const newlineChar = getNewlineChar(newlineType);
  const lines = [header, separator, ...rows];
  return lines.join(newlineChar);
}

/**
 * 根据支付方式分组数据
 * @param data 对象数组
 * @returns 按支付方式分组的数据
 */
function groupByPaymentMethod(data: Object[]): Record<string, Object[]> {
  const groups: Record<string, Object[]> = {};

  data.forEach(item => {
    const paymentMethod = String(item['支付方式' as keyof typeof item] || '未知支付方式');
    if (!groups[paymentMethod]) {
      groups[paymentMethod] = [];
    }
    groups[paymentMethod].push(item);
  });

  return groups;
}

/**
 * 按交易成功时间降序排序
 * @param data 对象数组
 * @returns 排序后的数据
 */
function sortBySuccessTime(data: Object[]): Object[] {
  return data.sort((a, b) => {
    const timeA = String(a['交易成功时间' as keyof typeof a] || '');
    const timeB = String(b['交易成功时间' as keyof typeof b] || '');
    return timeB.localeCompare(timeA); // 降序
  });
}

async function main({ params }: Args): Promise<Output> {
  const { input } = params;
  const newlineType = 'unicode';

  try {
    // 验证输入数据
    if (!Array.isArray(input)) {
      return {
        output: '错误：输入数据必须是数组格式',
      };
    }

    // 过滤掉无效数据
    const validData = input.filter(
      item =>
        item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length > 0
    );

    if (validData.length === 0) {
      return {
        output: '错误：没有找到有效的对象数据',
      };
    }

    // 按支付方式分组
    const groupedData = groupByPaymentMethod(validData);
    const newlineChar = getNewlineChar(newlineType);

    // 生成主标题
    let markdown = `# 已匹配订单数据详情${newlineChar}${newlineChar}`;

    // 为每个支付方式生成表格
    const paymentMethods = Object.keys(groupedData).sort(); // 按支付方式名称排序

    for (const paymentMethod of paymentMethods) {
      const data = groupedData[paymentMethod];
      // 按交易成功时间降序排序
      const sortedData = sortBySuccessTime(data);

      // 生成表格
      const table = generateMarkdownTable(sortedData, newlineType);

      // 添加支付方式标题和表格
      markdown += `## ${paymentMethod}${newlineChar}${newlineChar}${table}${newlineChar}${newlineChar}`;
    }

    return {
      output: markdown,
    };
  } catch (error) {
    return {
      output: `错误：${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}

// 测试函数
async function testMatchMarkdown() {
  const testData = [
    {
      交易创建时间: '2025-03-10 06:59:59',
      支付方式: '招商银行信用卡()',
      实付金额: '¥8.00',
      备注: '/',
      订单标题: '【新品￥8】1份滑蛋乳酪云朵汤种吐司',
      交易成功时间: '2025-03-10 07:00:01',
      交易类型: '退款',
      '收/支': '收入',
      订单金额: '¥8.00',
      交易单号: '2503625',
      商家单号: '498A',
    },
    {
      交易创建时间: '2025-03-11 14:09:50',
      支付方式: '微信支付',
      实付金额: '¥16.40',
      备注: '测试',
      订单标题: '【测试商品】',
      交易成功时间: '2025-03-11 14:10:01',
      交易类型: '退款',
      '收/支': '收入',
      订单金额: '¥16.40',
      交易单号: '2503626',
      商家单号: '498B',
    },
  ];

  console.log('=== 已匹配订单数据markdown生成测试 ===');
  const result = await main({ params: { input: testData } });

  console.log('生成的markdown:');
  console.log(result.output);
}

// 取消注释下面的行来运行测试
// testMatchMarkdown().catch(console.error);

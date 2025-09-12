// 根据final.ts的match输出，生成markdown组件使用的字符串
import {
  //  MeituanOrder, PaymentData, 
  MarkdownGeneratorInput, MarkdownGeneratorOutput } from '../../types';

type Args = MarkdownGeneratorInput;
type Output = MarkdownGeneratorOutput;
interface MeituanOrder {
  支付方式: string;
  实付金额: string;
  备注: string;
  订单标题: string;
  交易创建时间: string;
  交易成功时间: string;
  交易类型: string;
  '收/支': string;
  订单金额: string;
  交易单号: string;
  商家单号: string;
}

/**
 * 微信支付数据格式
 */
 interface WechatPayment {
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
}

/**
 * 招商银行储蓄卡数据格式
 */
 interface CmbDebitCardPayment {
  记账日期: string;
  货币: string;
  交易金额: string;
  联机余额: string;
  交易摘要: string;
  对手信息: string;
  数据来源: string;
}

/**
 * 招商银行信用卡数据格式（假设）
 */
 interface CmbCreditCardPayment {
  记账日期: string;
  货币: string;
  交易金额: string;
  联机余额: string;
  交易摘要: string;
  对手信息: string;
  数据来源: string;
}

/**
 * 支付宝数据格式（假设）
 */
 interface AlipayPayment {
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
}
type PaymentData =
  | WechatPayment
  | CmbDebitCardPayment
  | CmbCreditCardPayment
  | AlipayPayment;
// MatchResult类型定义
type MatchResult = {
  '美团': MeituanOrder;
  [key: string]: MeituanOrder | PaymentData;
};

/**
 * 获取支付渠道名称
 * @param matchResult 匹配结果对象
 * @returns 支付渠道名称
 */
function getPaymentChannel(matchResult: MatchResult): string {
  for (const key in matchResult) {
    if (key !== '美团') {
      return key;
    }
  }
  return '';
}

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
 * 生成匹配数据的markdown表格
 * @param data 匹配结果数组
 * @param newlineType 换行类型
 * @returns markdown表格字符串
 */
function generateMatchTable(data: MatchResult[], newlineType: string): string {
  if (!data || data.length === 0) {
    return '暂无数据';
  }

  // 定义美团订单的列顺序
  const meituanColumns = [
    '支付方式',
    '交易成功时间',
    '交易创建时间',
    '订单金额',
    '实付金额',
    '订单标题',
  ];

  // 定义支付数据的列顺序（根据支付类型确定）
  const getPaymentColumns = (paymentData: PaymentData): string[] => {
    const dataSource = paymentData.数据来源;
    
    switch (dataSource) {
      case '微信支付':
        return [
          '交易时间',
          '金额(元)',
        ];
        
      case '支付宝':
        return [
          '交易时间',
          '金额(元)',
        ];
        
      case '招商银行储蓄卡':
        return [
          '记账日期',
          '交易金额',
        ];
        
      case '招商银行信用卡':
        return [
          '记账日期',
          '交易金额',
        ];
        
      default:
        return []
    }
  };

  // 获取支付数据的列显示名称
  const getPaymentColumnNames = (paymentData: PaymentData): string[] => {
    const dataSource = paymentData.数据来源;
    
    switch (dataSource) {
      case '微信支付':
      case '支付宝':
        return [
          '支付侧时间',
          '支付侧金额',
        ];
        
      case '招商银行储蓄卡':
      case '招商银行信用卡':
        return [
          '支付侧时间',
          '支付侧金额',
        ];
        
      default:
        return []
    }
  };

  // 如果没有数据，使用默认的支付列
  const paymentColumns = data.length > 0 ? getPaymentColumns(data[0][getPaymentChannel(data[0])] as PaymentData) : [
    '交易时间',
    '金额(元)',
  ];
  
  // 获取支付列的显示名称
  const paymentColumnNames = data.length > 0 ? getPaymentColumnNames(data[0][getPaymentChannel(data[0])] as PaymentData) : [
    '支付侧时间',
    '支付侧金额',
  ];

  // 生成表头
  const meituanHeader = meituanColumns.map(col => `美团-${col}`).join(' | ');
  const paymentHeader = paymentColumnNames.join(' | ');
  const header = `| ${meituanHeader} | ${paymentHeader} |`;

  // 生成分隔线
  const meituanSeparator = meituanColumns.map(() => '---').join(' | ');
  const paymentSeparator = paymentColumns.map(() => '---').join(' | ');
  const separator = `| ${meituanSeparator} | ${paymentSeparator} |`;

  // 生成数据行
  const rows = data.map((matchResult) => {
    const meituanOrder = matchResult['美团'] as MeituanOrder;
    const paymentChannel = getPaymentChannel(matchResult);
    const paymentData = matchResult[paymentChannel] as PaymentData;
    
    // 美团订单数据
    const meituanValues = meituanColumns.map(key => {
      const value = (meituanOrder as any)[key];
      if (value === null || value === undefined) {
        return '';
      }
      return String(value);
    });

    // 支付数据
    const paymentValues = paymentColumns.map(key => {
      const value = (paymentData as any)[key];
      if (value === null || value === undefined) {
        return '';
      }
      return String(value);
    });

    return `| ${meituanValues.join(' | ')} | ${paymentValues.join(' | ')} |`;
  });

  // 使用指定类型的换行符
  const newlineChar = getNewlineChar(newlineType);
  const lines = [header, separator, ...rows];
  return lines.join(newlineChar);
}

/**
 * 根据支付数据来源分组匹配结果
 * @param data 匹配结果数组
 * @returns 按数据来源分组的数据
 */
function groupByDataSource(data: MatchResult[]): Record<string, MatchResult[]> {
  const groups: Record<string, MatchResult[]> = {};

  data.forEach((matchResult) => {
    const paymentChannel = getPaymentChannel(matchResult);
    if (!paymentChannel) return; // 跳过没有支付渠道的数据
    
    const paymentData = matchResult[paymentChannel] as PaymentData;
    if (!paymentData) return; // 跳过没有支付数据的数据
    
    const dataSource = paymentData.数据来源 || '未知数据来源';
    
    if (!groups[dataSource]) {
      groups[dataSource] = [];
    }
    groups[dataSource].push(matchResult);
  });

  return groups;
}

/**
 * 按美团订单交易成功时间降序排序
 * @param data 匹配结果数组
 * @returns 排序后的数据
 */
function sortBySuccessTime(data: MatchResult[]): MatchResult[] {
  return data.sort((a, b) => {
    const timeA = (a['美团'] as MeituanOrder).交易成功时间 || '';
    const timeB = (b['美团'] as MeituanOrder).交易成功时间 || '';
    return timeB.localeCompare(timeA); // 降序
  });
}

async function main({ params }: Args): Promise<Output> {
  const { input } = params;
  const newlineType = 'unicode';
  const newlineChar = getNewlineChar(newlineType);

  try {
    // 验证输入数据
    if (!Array.isArray(input)) {
      return {
        output: `# 已匹配订单数据详情${newlineChar}${newlineChar}错误：输入数据必须是数组格式`,
      };
    }

    // 过滤掉无效数据 - 确保是MatchResult格式
    const validData = input.filter(
      item =>
        item && typeof item === 'object' && 
        '美团' in item && 
        item['美团'] && typeof item['美团'] === 'object'
    ) as MatchResult[];

    if (validData.length === 0) {
      return {
        output: `# 已匹配订单数据详情${newlineChar}${newlineChar}没有匹配数据`,
      };
    }

    // 按数据来源分组
    const groupedData = groupByDataSource(validData);

    // 生成主标题
    let markdown = `# 已匹配订单数据详情${newlineChar}${newlineChar}`;

    // 为每个数据来源生成表格
    const dataSources = Object.keys(groupedData).sort(); // 按数据来源名称排序

    for (const dataSource of dataSources) {
      const data = groupedData[dataSource];
      // 按交易成功时间降序排序
      const sortedData = sortBySuccessTime(data);

      // 生成表格
      const table = generateMatchTable(sortedData, newlineType);

      // 添加数据来源标题和表格
      markdown += `## ${dataSource}${newlineChar}${newlineChar}${table}${newlineChar}${newlineChar}`;
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

export default main;

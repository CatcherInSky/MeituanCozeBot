// 广发银行信用卡demo数据处理，由单个PDF解析出起止日期，还有每条交易流水详情
import { GfCreditCardPayment, ChannelProcessOutput, FunctionArgs } from '../../types';

type Args = FunctionArgs<{ input: string }>;
type Output = ChannelProcessOutput<GfCreditCardPayment>;

async function main({ params }: Args): Promise<Output> {
  const { input } = params;

  // 清理输入数据，但保留换行符以便处理跨行数据
  const cleanedInput = input
    .replace(/\n+/g, '\n') // 将多个换行符合并为单个换行符
    .replace(/[ \t]+/g, ' ') // 将多个空格/制表符合并为单个空格
    .trim();

  const transactions: GfCreditCardPayment[] = [];
  let dateRange: string[] = [];

  // 查找账单周期：账单周期YYYY/MM/DD - YYYY/MM/DD
  const billCycleMatch = cleanedInput.match(/账单周期(\d{4}\/\d{2}\/\d{2})\s*-\s*(\d{4}\/\d{2}\/\d{2})/);
  
  if (billCycleMatch) {
    // 转换日期格式为标准格式 YYYY-MM-DD HH:mm:ss
    const startDate = billCycleMatch[1].replace(/\//g, '-') + ' 00:00:00';
    const endDate = billCycleMatch[2].replace(/\//g, '-') + ' 23:59:59';
    dateRange = [startDate, endDate];
  }

  // 查找数据解析范围：从"注：若您名下的多张信用卡主卡均有欠款，需分别还款"到"用卡安全温馨提示："
  const startMarker = '注：若您名下的多张信用卡主卡均有欠款，需分别还款';
  const endMarker = '用卡安全温馨提示：';
  
  const startIndex = cleanedInput.indexOf(startMarker);
  const endIndex = cleanedInput.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    console.warn('Could not find data boundaries in GF credit card statement');
    return {
      output: {
        channel: '广发银行信用卡',
        date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
        data: [],
      },
    };
  }

  // 提取交易数据区域
  const dataSection = cleanedInput.substring(startIndex, endIndex);
  
  // 按行分割数据
  const lines = dataSection.split('\n').filter(line => line.trim());
  
  // 查找表头行：交易日期入账日期交易摘要交易金额交易货币入账金额入账货币
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易日期') && lines[i].includes('入账日期') && 
        lines[i].includes('交易摘要') && lines[i].includes('交易金额')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    console.warn('Could not find header in GF credit card data');
    return {
      output: {
        channel: '广发银行信用卡',
        date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
        data: [],
      },
    };
  }

  // 解析交易数据（表头后的数据）
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过空行和非交易数据行
    if (!line || line.includes('卡号：') || line.includes('交易明细') || 
        line.length < 20) {
      continue;
    }

    try {
      // 广发银行信用卡数据特点：一行拼接，日期YYYY/MM/DD格式，金额两位小数
      // 示例：2024/02/242024/02/25(消费)（特约）美团46.00 人民币46.00 人民币
      
      // 尝试解析交易日期和入账日期 (YYYY/MM/DD格式)
      const dateMatch = line.match(/^(\d{4}\/\d{2}\/\d{2})(\d{4}\/\d{2}\/\d{2})/);
      if (!dateMatch) continue;
      
      const transactionDate = dateMatch[1];
      const postingDate = dateMatch[2];
      
      // 移除日期部分，获取剩余内容
      const remainingContent = line.substring(dateMatch[0].length);
      
      // 解析交易类型（消费）、（退货）等
      const typeMatch = remainingContent.match(/^\s*\(([^)]+)\)/);
      if (!typeMatch) continue;
      
      const transactionType = typeMatch[1];
      
      // 移除交易类型，获取剩余内容
      const afterType = remainingContent.substring(typeMatch[0].length);
      
      // 解析金额：找到最后的金额模式 "数字.数字 人民币数字.数字 人民币"
      const amountMatch = afterType.match(/(-?\d+\.?\d*)\s*人民币(-?\d+\.?\d*)\s*人民币\s*$/);
      if (!amountMatch) continue;
      
      const transactionAmount = amountMatch[1];
      const postingAmount = amountMatch[2];
      
      // 提取交易摘要（去除金额部分）
      const summaryPart = afterType.substring(0, afterType.lastIndexOf(amountMatch[0])).trim();
      
      const transaction: GfCreditCardPayment = {
        交易日期: transactionDate,
        入账日期: postingDate,
        交易摘要: `(${transactionType})${summaryPart}`,
        交易金额: transactionAmount,
        交易货币: '人民币',
        入账金额: postingAmount,
        入账货币: '人民币',
        数据来源: '广发银行信用卡',
      };

      transactions.push(transaction);
    } catch (error) {
      console.warn('Error parsing GF credit card transaction:', error, line);
    }
  }

  return {
    output: {
      channel: '广发银行信用卡',
      date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
      data: transactions,
    },
  };
}

export default main;

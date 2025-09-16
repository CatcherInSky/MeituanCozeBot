// 招商银行信用卡demo数据处理，由单个PDF解析出起止日期，还有每条交易流水详情
import { CmbCreditCardPayment, ChannelProcessOutput, FunctionArgs } from '../../types';

type Args = FunctionArgs<{ input: string }>;
type Output = ChannelProcessOutput<CmbCreditCardPayment>;

async function main({ params }: Args): Promise<Output> {
  const { input } = params;

  // 清理输入数据，但保留换行符以便处理跨行数据
  const cleanedInput = input
    .replace(/\r\n/g, '\n') // 统一换行符
    .replace(/\n+/g, '\n') // 将多个换行符合并为单个换行符
    .trim();

  const transactions: CmbCreditCardPayment[] = [];
  let dateRange: string[] = [];

  // 查找账单日期：账单日下一行的日期
  const billDateMatch = cleanedInput.match(/账单日\s*\n\s*(\d{4})年(\d{2})月(\d{2})日/);
  
  if (billDateMatch) {
    const year = billDateMatch[1];
    const month = billDateMatch[2];
    const day = billDateMatch[3];
    
    // 账单日作为结束日期
    const endDate = `${year}-${month}-${day} 23:59:59`;
    
    // 开始日期往前推一个月
    const endDateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const startDateObj = new Date(endDateObj.getFullYear(), endDateObj.getMonth() - 1, endDateObj.getDate());
    const startDate = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, '0')}-${String(startDateObj.getDate()).padStart(2, '0')} 00:00:00`;
    
    dateRange = [startDate, endDate];
  }

  // 查找数据解析范围：从"本期账务明细 Transaction Details"到第二个"本期还款总额"
  const startMarker = '本期账务明细 Transaction Details';
  const endMarker = '本期还款总额';
  
  const startIndex = cleanedInput.indexOf(startMarker);
  const firstEndIndex = cleanedInput.indexOf(endMarker);
  const endIndex = cleanedInput.indexOf(endMarker, firstEndIndex + 1); // 查找第二个"本期还款总额"
  
  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    console.warn('Could not find data boundaries in CMB credit card statement');
    return {
      output: {
        channel: '招商银行信用卡',
        date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
        data: [],
      },
    };
  }

  // 提取交易数据区域
  const dataSection = cleanedInput.substring(startIndex, endIndex);
  
  // 按行分割数据
  const lines = dataSection.split('\n').filter(line => line.trim());
  
  // 跳过表头，查找数据开始位置
  let dataStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('SOLDPOSTEDDESCRIPTION') || 
        lines[i].includes('交易日记账日交易摘要') ||
        lines[i].includes('人民币账户 RMB A/C')) {
      dataStartIndex = i + 1;
      break;
    }
  }

  if (dataStartIndex === -1) {
    console.warn('Could not find data start in CMB credit card statement');
    return {
      output: {
        channel: '招商银行信用卡',
        date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
        data: [],
      },
    };
  }

  // 解析交易数据，特别处理类型字段
  let currentType = '';
  
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过空行
    if (!line) continue;
    
    // 检查是否是类型行（单独一行，如" 还款"、" 退款"、" 消费"等）
    const typeMatch = line.match(/^\s*(还款|退款|消费|分期|调整|费用|利息|其他)\s*$/);
    if (typeMatch) {
      currentType = typeMatch[1];
      continue;
    }
    
    // 如果没有当前类型，跳过
    if (!currentType) continue;
    
    try {
      // 招商银行信用卡数据特点：一行拼接格式
      // 交易日/记账日：MM/DD格式，金额：两位小数，可能包含(CN)标识
      // 示例：07/28 07/29 财付通-广州教育物业管理有限公司155366.801234366.80(CN)
      
      // 解析交易日和记账日 (MM/DD格式)
      const dateMatch = line.match(/^(\d{2}\/\d{2})\s+(\d{2}\/\d{2})\s+(.+)/);
      if (!dateMatch) continue;
      
      const transactionDate = dateMatch[1]; // MM/DD
      const postingDate = dateMatch[2]; // MM/DD
      const remainingContent = dateMatch[3];
      
      // 解析金额和卡号末四位：寻找数字+卡号+金额的模式
      // 示例：财付通-测试造型店18.54562518.54(CN)
      // 或者：预约还款-585.835625-585.83
      // 特殊格式：财付通-测试物业管理公司155366.805625366.80(CN)
      
      // 使用精确的正则匹配策略
      // 格式：摘要+（带符号）精确到两位小数数字+4位数字（卡号）+（带符号）精确到两位小数数字+位置信息
      // 示例：财付通-测试造型店18.54123418.54(CN)
      let amountMatch = remainingContent.match(/(.+?)(-?\d+(?:,\d{3})*\.\d{2})(\d{4})(-?\d+(?:,\d{3})*\.\d{2})(\([^)]*\))?$/);
      
      // 如果没有匹配到，尝试匹配没有位置信息的情况
      if (!amountMatch) {
        amountMatch = remainingContent.match(/(.+?)(-?\d+(?:,\d{3})*\.\d{2})(\d{4})(-?\d+(?:,\d{3})*\.\d{2})$/);
      }
      
      if (!amountMatch) {
        // 尝试另一种格式：没有卡号的情况
        const simpleAmountMatch = remainingContent.match(/(.+?)(-?\d+(?:,\d{3})*\.?\d*)$/);
        if (simpleAmountMatch) {
          const summary = simpleAmountMatch[1].trim();
          const amount = simpleAmountMatch[2].replace(/,/g, ''); // 移除千分位逗号
          
          const transaction: CmbCreditCardPayment = {
            交易日: transactionDate,
            记账日: postingDate,
            交易摘要: summary,
            人民币金额: amount,
            卡号末四位: '',
            交易地金额: amount,
            类型: currentType,
            数据来源: '招商银行信用卡',
          };

          transactions.push(transaction);
        }
        continue;
      }
      
      const summary = amountMatch[1].trim();
      const firstAmount = amountMatch[2].replace(/,/g, ''); // 移除千分位逗号
      const cardLast4 = amountMatch[3];
      const secondAmount = amountMatch[4].replace(/,/g, ''); // 移除千分位逗号
      const locationInfo = amountMatch[5] || '';
      
      const transaction: CmbCreditCardPayment = {
        交易日: transactionDate,
        记账日: postingDate,
        交易摘要: summary,
        人民币金额: firstAmount,
        卡号末四位: cardLast4,
        交易地金额: secondAmount + locationInfo,
        类型: currentType,
        数据来源: '招商银行信用卡',
      };

      transactions.push(transaction);
    } catch (error) {
      console.warn('Error parsing CMB credit card transaction:', error, line);
    }
  }

  return {
    output: {
      channel: '招商银行信用卡',
      date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
      data: transactions,
    },
  };
}

export default main;

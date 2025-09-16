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

  // 查找数据解析范围：从第一个表头到"用卡安全温馨提示："
  const startMarker = '交易日期入账日期交易摘要交易金额交易货币入账金额入账货币';
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
  
  // 查找所有表头位置：交易日期入账日期交易摘要交易金额交易货币入账金额入账货币
  const headerIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('交易日期') && lines[i].includes('入账日期') && 
        lines[i].includes('交易摘要') && lines[i].includes('交易金额')) {
      headerIndices.push(i);
    }
  }
  
  // 如果没找到表头，尝试更宽松的查找条件
  if (headerIndices.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('交易日期') && lines[i].includes('交易金额')) {
        headerIndices.push(i);
      }
    }
  }
  
  // 查找分页标识位置
  const pageIndices: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\d+\/3$/)) {
      pageIndices.push(i);
    }
  }
  
  // 如果没找到表头，尝试查找卡号行作为数据开始位置
  if (headerIndices.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('卡号：')) {
        headerIndices.push(i);
        break;
      }
    }
  }

  if (headerIndices.length === 0) {
    console.warn('Could not find header in GF credit card data');
    return {
      output: {
        channel: '广发银行信用卡',
        date: dateRange.length === 2 ? [dateRange[0], dateRange[1]] : [],
        data: [],
      },
    };
  }

  // 解析交易数据（所有表头后的数据）
  // 广发银行数据格式：每3行为一组交易记录
  // 第1行：交易日期+入账日期
  // 第2行：交易类型+交易摘要
  // 第3行：交易金额+货币+入账金额+货币
  
  // 处理每个表头区域的数据
  for (let headerIdx = 0; headerIdx < headerIndices.length; headerIdx++) {
    const headerIndex = headerIndices[headerIdx];
    
    // 计算当前表头区域的结束位置
    let endIndex: number;
    
    if (headerIdx < headerIndices.length - 1) {
      // 不是最后一个表头，结束位置是下一个表头
      endIndex = headerIndices[headerIdx + 1];
    } else {
      // 最后一个表头，结束位置是数据结束
      endIndex = lines.length;
    }
    
    // 第一个表头区域需要特殊处理，跳过标题行
    let startLine = headerIndex + 1;
    if (headerIdx === 0) {
      // 跳过第一个表头区域的标题行
      while (startLine < endIndex && 
             (lines[startLine].includes('交易明细') || 
              lines[startLine].includes('卡号：'))) {
        startLine++;
      }
    }
    
    for (let i = startLine; i < endIndex - 2; i += 3) {
      try {
        const dateLine = lines[i].trim();
        const summaryLine = lines[i + 1]?.trim() || '';
        const amountLine = lines[i + 2]?.trim() || '';
        
        // 跳过空行和非交易数据行
        if (!dateLine || !summaryLine || !amountLine || 
            dateLine.includes('卡号：') || dateLine.includes('交易明细') ||
            summaryLine.includes('交易明细') || summaryLine.includes('卡号：') ||
            amountLine.includes('交易明细') || amountLine.includes('卡号：')) {
          continue;
        }

        // 解析交易日期和入账日期 (YYYY/MM/DD格式)
        const dateMatch = dateLine.match(/^(\d{4}\/\d{2}\/\d{2})(\d{4}\/\d{2}\/\d{2})/);
        if (!dateMatch) continue;
        
        const transactionDate = dateMatch[1];
        const postingDate = dateMatch[2];
        
        // 解析交易类型和摘要
        const typeMatch = summaryLine.match(/^\(([^)]+)\)(.+)/);
        if (!typeMatch) continue;
        
        const transactionType = typeMatch[1];
        const summary = typeMatch[2].trim();
        
        // 解析金额：格式如 "8.49 人民币8.49 人民币"
        const amountMatch = amountLine.match(/(-?\d+\.?\d*)\s*人民币(-?\d+\.?\d*)\s*人民币/);
        if (!amountMatch) continue;
        
        const transactionAmount = amountMatch[1];
        const postingAmount = amountMatch[2];
        
        const transaction: GfCreditCardPayment = {
          交易日期: transactionDate,
          入账日期: postingDate,
          交易摘要: `(${transactionType})${summary}`,
          类型: transactionType,
          交易金额: transactionAmount,
          交易货币: '人民币',
          入账金额: postingAmount,
          入账货币: '人民币',
          数据来源: '广发银行信用卡',
        };

        transactions.push(transaction);
      } catch (error) {
        console.warn('Error parsing GF credit card transaction:', error, lines[i]);
      }
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

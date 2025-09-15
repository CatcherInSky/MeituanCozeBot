/**
 * 根据文件URL判断支付渠道
 * 通过解析URL中的x-wf-file_name参数，根据文件名特征判断支付渠道类型
 */
import { 
  // PaymentChannel, 
  UrlBranchOutput, FunctionArgs } from '../types';

type Args = FunctionArgs<{ input: string }>;
type Output = UrlBranchOutput;



 type PaymentChannel = '美团' | '微信支付' | '招商银行储蓄卡' | '招商银行信用卡' | '支付宝' | '广发银行信用卡';
/**
 * 从URL中提取文件名
 * @param url 文件URL
 * @returns 解码后的文件名
 */
 function extractFileName(url: string): string {
  try {
    const urlObj = new URL(url);
    const fileName = urlObj.searchParams.get('x-wf-file_name');
    if (fileName) {
      return decodeURIComponent(fileName);
    }
    return '';
  } catch (error) {
    // 如果URL解析失败，尝试从输入中直接提取文件名
    const match = url.match(/x-wf-file_name=([^&]+)/);
    if (match) {
      try {
        return decodeURIComponent(match[1]);
      } catch (decodeError) {
        return match[1]; // 如果解码失败，返回原始字符串
      }
    }
    return '';
  }
}

/**
 * 根据文件名判断支付渠道
 * @param fileName 文件名
 * @returns 支付渠道类型
 */
 function detectPaymentChannel(fileName: string): PaymentChannel | '' {
  if (!fileName) return ''; // 默认返回

  const lowerFileName = fileName.toLowerCase();

  // 美团：文件名包含"美团"
  if (lowerFileName.includes('美团')) {
    return '美团';
  }

  // 微信支付：文件名包含"微信支付"或"wechat"
  if (lowerFileName.includes('微信支付') || lowerFileName.includes('wechat')) {
    return '微信支付';
  }

  // 支付宝：文件名包含"支付宝"或"alipay"
  if (lowerFileName.includes('支付宝') || lowerFileName.includes('alipay')) {
    return '支付宝';
  }

  // 广发银行信用卡：文件名格式为"X年X月综合对账单打印版"
  if (lowerFileName.includes('综合对账单打印版') || 
      (lowerFileName.includes('广发') && lowerFileName.includes('信用卡'))) {
    return '广发银行信用卡';
  }

  // 招商银行优先级处理：储蓄卡优先级更高
  if (lowerFileName.includes('招商银行') || lowerFileName.includes('招商')) {
    // 如果同时包含储蓄卡和信用卡关键词，优先返回储蓄卡
    if (lowerFileName.includes('储蓄卡')) {
      return '招商银行储蓄卡';
    }
    // 如果包含信用卡账单特征
    if (lowerFileName.includes('信用卡账单') || lowerFileName.includes('信用卡')) {
      return '招商银行信用卡';
    }
    // 如果包含交易流水特征
    if (lowerFileName.includes('交易流水')) {
      return '招商银行储蓄卡';
    }
    // 默认为储蓄卡（优先级更高）
    return '招商银行储蓄卡';
  }

  // 独立检查信用卡（不包含招商银行关键词的情况）
  if (lowerFileName.includes('信用卡账单') || lowerFileName.includes('信用卡')) {
    return '招商银行信用卡';
  }

  // 独立检查储蓄卡（不包含招商银行关键词的情况）
  if (lowerFileName.includes('交易流水') || lowerFileName.includes('储蓄卡')) {
    return '招商银行储蓄卡';
  }

  return ''; // 默认返回
}

/**
 * 主处理函数 - 用于Coze Bot
 * @param params 输入参数
 * @returns 支付渠道信息
 */
async function main({ params }: Args): Promise<Output> {
  const { input: url } = params;

  // 处理null或无效输入
  if (!url || typeof url !== 'string') {
    return {
      output: '',
    };
  }

  try {
    const fileName = extractFileName(url);

    return {
      output: detectPaymentChannel(fileName),
    };
  } catch (error) {
    return {
      output: '',
    };
  }
}

export { extractFileName, detectPaymentChannel };
export default main;

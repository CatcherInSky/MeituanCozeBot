/**
 * 根据文件URL判断支付渠道
 * 通过解析URL中的x-wf-file_name参数，根据文件名特征判断支付渠道类型
 */
type Args = { params: { input: string } };
type Output = {
  output:  '' | '微信支付' | '支付宝' | '招商银行储蓄卡' | '招商银行信用卡';
  // | '广发银行信用卡' | '中国建设银行储蓄卡' | '中国银行储蓄卡';
};

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
    console.error('URL解析错误:', error);
    return '';
  }
}

/**
 * 根据文件名判断支付渠道
 * @param fileName 文件名
 * @returns 支付渠道类型
 */
function detectPaymentChannel(fileName: string): Output['output'] {
  if (!fileName) return ''; // 默认返回
  
  const lowerFileName = fileName.toLowerCase();
  
  // 微信支付：文件名包含"微信支付"
  if (lowerFileName.includes('微信支付') || lowerFileName.includes('wechat')) {
    return '微信支付';
  }
  
  // 支付宝：文件名包含"支付宝"或"alipay"
  if (lowerFileName.includes('支付宝') || lowerFileName.includes('alipay')) {
    return '支付宝';
  }
  
  // 招商银行储蓄卡：文件名包含"招商银行交易流水"
  if (lowerFileName.includes('招商银行交易流水')) {
    return '招商银行储蓄卡';
  }
  
  // 招商银行信用卡：文件名包含"信用卡账单"或"信用卡"且包含年月格式
  if (lowerFileName.includes('信用卡账单') || 
      (lowerFileName.includes('信用卡') && /\d{4}年\d{1,2}月/.test(fileName))) {
    return '招商银行信用卡';
  }
  
// todo 新增

  // 其他招商银行相关文件，默认为储蓄卡
  if (lowerFileName.includes('招商银行')) {
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
  
  try {
    
  const fileName = extractFileName(url);

    return {
      output: detectPaymentChannel(fileName)
    };
  } catch (error) {
    return {
      output: '微信支付' // 默认返回
    };
  }
}
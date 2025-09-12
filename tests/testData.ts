// 测试数据集合
import { MeituanOrder, PaymentData, AggregatedChannelData, PaymentChannel } from '../types';

// 美团订单测试数据
export const meituanTestData: MeituanOrder[] = [
  {
    交易创建时间: '2025-09-08 15:53:25',
    交易成功时间: '2025-09-08 15:53:25',
    订单金额: '¥70.56',
    实付金额: '¥70.56',
    订单标题: '朴朴商品订单',
    备注: '/',
    交易单号: '420000',
    商家单号: '040',
    交易类型: '商户消费',
    '收/支': '支出',
    支付方式: '招商银行储蓄卡()',
  },
  {
    交易创建时间: '2025-06-02 15:08:21',
    交易成功时间: '2025-06-02 15:08:27',
    订单金额: '¥16.00',
    实付金额: '¥16.00',
    订单标题: '茉莉奶白 订单详情',
    备注: '/',
    交易单号: '123',
    商家单号: '123',
    交易类型: '支付',
    '收/支': '支出',
    支付方式: '招商银行信用卡()',
  },
];

// 微信支付测试数据
export const wechatTestData: PaymentData[] = [
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
    数据来源: '微信支付',
  },
];

// 招商银行储蓄卡测试数据
export const cmbDebitCardTestData: PaymentData[] = [
  {
    记账日期: '2024-09-15',
    货币: 'CNY',
    交易金额: '-50.00',
    联机余额: '760.81',
    交易摘要: '快捷支付岭南通',
    对手信息: '123',
    数据来源: '招商银行储蓄卡',
  },
];

// 聚合渠道测试数据
export const aggregatedChannelTestData: AggregatedChannelData = {
  Group1: {
    channel: '微信支付' as PaymentChannel,
    date: ['2025-06-08 00:00:00', '2025-09-08 23:59:59'] as [string, string],
    data: wechatTestData,
  },
  Group2: {
    channel: '招商银行储蓄卡' as PaymentChannel,
    date: ['2024-09-06 00:00:00', '2025-09-06 23:59:59'] as [string, string],
    data: cmbDebitCardTestData,
  },
};

// 美团原始输入数据（JSON字符串）
export const meituanRawInputData = [
  '[{"﻿美团交易账单明细":"美团用户名：[]"},{"﻿美团交易账单明细":"起始时间：[2025-03-08] 终止时间：[2025-06-08]"},{"﻿美团交易账单明细":"导出交易类型：[全部]"},{"﻿美团交易账单明细":"导出时间：[2025-09-08 12:09:25]"},{"﻿美团交易账单明细":""},{"﻿美团交易账单明细":"共：15笔记录"},{"﻿美团交易账单明细":"支出：10笔 192.46元"},{"﻿美团交易账单明细":"收入：5笔 53.62元"},{"﻿美团交易账单明细":"不计收支：0笔 0.00元"},{"﻿美团交易账单明细":""},{"﻿美团交易账单明细":"特别提示："},{"﻿美团交易账单明细":"1. 本明细与实际交易结果不符时，以实际交易情况为准"},{"﻿美团交易账单明细":"2. 本明细仅展示当前账单中的交易，不包括已删除的记录"},{"﻿美团交易账单明细":"3. 部分账单记录如充值/提现等交易，不计入为收入或支出类别"},{"﻿美团交易账单明细":"4. 因统计逻辑不同，明细的实付金额累加后可能与统计金额不一致，请以实际交易金额为准"},{"﻿美团交易账单明细":"5. 本明细仅供用户个人对账使用，不具备任何证明效力，禁止用于非法用途"},{"﻿美团交易账单明细":""},{"﻿美团交易账单明细":"【美团交易账单明细列表】"},{"﻿美团交易账单明细":"交易创建时间","null":["交易成功时间","交易类型","订单标题","收/支","支付方式","订单金额","实付金额","交易单号","商家单号","备注"]},{"﻿美团交易账单明细":"2025-06-02 15:08:21","null":["2025-06-02 15:08:27","支付","茉莉奶白 订单详情","支出","招商银行信用卡()","¥16.00","¥16.00","123\\t","123\\t","/"]}]',
];

// 微信支付原始输入数据（JSON字符串）
export const wechatRawInputData = '[{"微信支付账单明细":"微信昵称：[--]","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"起始时间：[2025-06-08 00:00:00] 终止时间：[2025-09-08 23:59:59]","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"导出类型：[全部]","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"导出时间：[2025-09-11 17:43:36]","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":null,"Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"共62笔记录","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"收入：5笔 37元","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"支出：57笔 1.82元","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"中性交易：0笔 0.00元","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"注：","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"1. 充值\\/提现\\/理财通购买\\/零钱通存取\\/信用卡还款等交易，将计入中性交易","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"2. 若交易记录明细无有效内容，则代表该时间段内此微信号无交易。","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"3. 本明细仅供个人对账使用","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":null,"Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"----------------------微信支付账单明细列表--------------------","Unnamed: 1":null,"Unnamed: 2":null,"Unnamed: 3":null,"Unnamed: 4":null,"Unnamed: 5":null,"Unnamed: 6":null,"Unnamed: 7":null,"Unnamed: 8":null,"Unnamed: 9":null,"Unnamed: 10":null},{"微信支付账单明细":"交易时间","Unnamed: 1":"交易类型","Unnamed: 2":"交易对方","Unnamed: 3":"商品","Unnamed: 4":"收\\/支","Unnamed: 5":"金额(元)","Unnamed: 6":"支付方式","Unnamed: 7":"当前状态","Unnamed: 8":"交易单号","Unnamed: 9":"商户单号","Unnamed: 10":"备注"},{"微信支付账单明细":"2025-09-08 15:53:25","Unnamed: 1":"商户消费","Unnamed: 2":"朴朴超市","Unnamed: 3":"朴朴商品订单","Unnamed: 4":"支出","Unnamed: 5":"¥70.56","Unnamed: 6":"招商银行储蓄卡()","Unnamed: 7":"支付成功","Unnamed: 8":"123","Unnamed: 9":"123","Unnamed: 10":"\\/"}]';

// 招商银行储蓄卡原始输入数据（PDF文本）
export const cmbDebitCardRawInputData = '\n\n1/16\n招商银行交易流水\nTransaction Statement of China Merchants Bank\n2024-09-06 -- 2025-09-06\n户  名：XXX\nName\n账户类型：ALL/全币种\nAccount Type\n申请时间：2025-09-08 19:15:51\nDate\n账号：65\nAccount No\n开 户 行：支行\nSub Branch\n验 证 码：111\nVerification Code\n记账日期货币交易金额联机余额交易摘要对手信息\nDateCurrency\nTransaction\nAmount\nBalanceTransaction TypeCounter Party\n2024-09-15CNY-50.00760.81快捷支付岭南通 123\n';

// URL测试数据
export const urlTestData = [
  {
    input: 'https://example.com/download?x-wf-file_name=微信支付账单_2025-09-08.xlsx',
    expected: '微信支付',
  },
  {
    input: 'https://example.com/download?x-wf-file_name=招商银行交易流水_2024-09-06.pdf',
    expected: '招商银行储蓄卡',
  },
  {
    input: 'https://example.com/download?x-wf-file_name=招商银行信用卡账单_2024年9月.pdf',
    expected: '招商银行信用卡',
  },
  {
    input: 'https://example.com/download?x-wf-file_name=支付宝账单_2025-09-08.xlsx',
    expected: '支付宝',
  },
  {
    input: 'https://example.com/download?x-wf-file_name=unknown_file.pdf',
    expected: '',
  },
];

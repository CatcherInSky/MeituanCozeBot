# 类型系统设计文档

## 概述

本项目已完善了统一的类型系统，解决了各渠道数据格式不一致的问题。所有TypeScript文件现在都使用严格的类型定义，提高了代码的可维护性和类型安全性。

## 核心类型定义

### 1. 支付渠道数据格式

#### 美团订单数据 (`MeituanOrder`)
```typescript
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
```

#### 微信支付数据 (`WechatPayment`)
```typescript
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
```

#### 招商银行储蓄卡数据 (`CmbDebitCardPayment`)
```typescript
interface CmbDebitCardPayment {
  记账日期: string;
  货币: string;
  交易金额: string;
  联机余额: string;
  交易摘要: string;
  对手信息: string;
  数据来源: string;
}
```

#### 招商银行信用卡数据 (`CmbCreditCardPayment`)
```typescript
interface CmbCreditCardPayment {
  记账日期: string;
  货币: string;
  交易金额: string;
  联机余额: string;
  交易摘要: string;
  对手信息: string;
  数据来源: string;
}
```

#### 支付宝数据 (`AlipayPayment`)
```typescript
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
```

### 2. 统一类型

#### 支付渠道枚举 (`PaymentChannel`)
```typescript
type PaymentChannel = 
  | '微信支付'
  | '招商银行储蓄卡'
  | '招商银行信用卡'
  | '支付宝';
```

#### 统一支付数据格式 (`PaymentData`)
```typescript
type PaymentData = 
  | WechatPayment
  | CmbDebitCardPayment
  | CmbCreditCardPayment
  | AlipayPayment;
```

#### 渠道数据组 (`ChannelDataGroup`)
```typescript
interface ChannelDataGroup {
  channel: PaymentChannel;
  date: [string, string]; // [开始时间, 结束时间]
  data: PaymentData[];
}
```

#### 聚合渠道数据 (`AggregatedChannelData`)
```typescript
interface AggregatedChannelData {
  [key: string]: ChannelDataGroup | null;
}
```

### 3. 函数输出格式

#### 渠道处理函数输出 (`ChannelProcessOutput`)
```typescript
interface ChannelProcessOutput<T extends PaymentData> {
  output: {
    channel: PaymentChannel;
    date: string[];
    data: T[];
  };
}
```

#### 美团数据处理输出 (`MeituanProcessOutput`)
```typescript
interface MeituanProcessOutput {
  output: MeituanOrder[];
}
```

#### 最终匹配输出 (`FinalOutput`)
```typescript
interface FinalOutput {
  multichannel: PaymentData[];
  match: MatchResult[];
  unmatch: MeituanOrder[];
  uncover: MeituanOrder[];
}
```

#### 匹配结果 (`MatchResult`)
```typescript
type MatchResult = [MeituanOrder, PaymentData];
```

## 类型守卫函数

### 1. 渠道类型检查
```typescript
function isWechatPayment(data: PaymentData): data is WechatPayment
function isCmbDebitCardPayment(data: PaymentData): data is CmbDebitCardPayment
function isCmbCreditCardPayment(data: PaymentData): data is CmbCreditCardPayment
function isAlipayPayment(data: PaymentData): data is AlipayPayment
```

### 2. 数据提取函数
```typescript
function getPaymentAmount(data: PaymentData): string
function getPaymentTime(data: PaymentData): string
```

## 文件结构

```
MeituanCozeBot/
├── types/
│   └── index.ts              # 统一类型定义
├── script/
│   ├── channel/
│   │   ├── meituan_filelist_process.ts    # 美团数据处理
│   │   ├── wechat_file_process.ts         # 微信支付数据处理
│   │   └── cmb_debitcard_file_process.ts  # 招商银行储蓄卡数据处理
│   ├── markdown/
│   │   ├── meituan_markdown_generator.ts  # 美团退款数据Markdown生成
│   │   ├── match_markdown_generator.ts    # 已匹配订单数据Markdown生成
│   │   ├── unmatch_markdown_generator.ts  # 无法匹配订单数据Markdown生成
│   │   └── uncover_markdown_generator.ts  # 未覆盖订单数据Markdown生成
│   ├── final.ts                           # 最终匹配处理
│   └── url_branch.ts                      # URL分支检测
└── TYPES.md                               # 类型系统文档
```

## 类型安全特性

### 1. 严格类型检查
- 所有函数参数和返回值都有明确的类型定义
- 使用联合类型和类型守卫确保类型安全
- 消除了所有`any`类型的使用

### 2. 渠道数据统一处理
- 通过`PaymentData`联合类型统一处理不同渠道的数据
- 使用类型守卫函数安全地访问特定渠道的字段
- 提供统一的金额和时间提取函数

### 3. 函数接口标准化
- 所有处理函数都使用`FunctionArgs<T>`和`FunctionOutput<T>`标准格式
- Markdown生成器使用统一的`MarkdownGeneratorInput`和`MarkdownGeneratorOutput`
- URL分支检测使用`UrlBranchOutput`格式

## 使用示例

### 1. 渠道数据处理
```typescript
import { WechatPayment, ChannelProcessOutput, FunctionArgs } from '../types';

type Args = FunctionArgs<{ input: string }>;
type Output = ChannelProcessOutput<WechatPayment>;

async function main({ params }: Args): Promise<Output> {
  // 处理逻辑
}
```

### 2. 类型安全的数据访问
```typescript
import { getPaymentAmount, getPaymentTime, isWechatPayment } from '../types';

function processPaymentData(data: PaymentData) {
  const amount = getPaymentAmount(data); // 安全获取金额
  const time = getPaymentTime(data);    // 安全获取时间
  
  if (isWechatPayment(data)) {
    // 现在可以安全访问微信支付特有字段
    console.log(data.交易对方);
  }
}
```

### 3. 最终匹配处理
```typescript
import { 
  MeituanOrder, 
  PaymentData, 
  AggregatedChannelData, 
  FinalOutput 
} from './types';

type Args = FunctionArgs<{ 
  input: AggregatedChannelData; 
  meituan: MeituanOrder[] 
}>;
type Output = FunctionOutput<FinalOutput>;
```

## 优势

1. **类型安全**: 编译时就能发现类型错误，减少运行时错误
2. **代码提示**: IDE可以提供准确的代码补全和错误提示
3. **重构安全**: 类型系统确保重构时不会破坏代码结构
4. **文档化**: 类型定义本身就是最好的文档
5. **维护性**: 统一的类型系统使代码更易于维护和扩展

## 扩展指南

### 添加新支付渠道

1. 在`types/index.ts`中定义新的支付数据接口
2. 更新`PaymentChannel`类型
3. 更新`PaymentData`联合类型
4. 添加相应的类型守卫函数
5. 更新`getPaymentAmount`和`getPaymentTime`函数

### 添加新字段

1. 在相应的接口中添加新字段
2. 更新相关的类型守卫函数
3. 更新数据处理逻辑

这个类型系统为项目提供了坚实的基础，确保了代码的健壮性和可维护性。

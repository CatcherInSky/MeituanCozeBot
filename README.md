# MeituanCozeBot
记录coze判断美团退款数据bot中使用的函数

# 项目结构

```
MeituanCozeBot/
├── types/             # 统一类型定义
│   └── index.ts
└──script/
    ├── channel/       # 支付渠道数据处理
    │   ├── wechat_file_process.ts
    │   ├── cmb_debitcard_file_process.ts
    │   └── meituan_filelist_process.ts
    ├── markdown/      # Markdown生成器
    │   ├── meituan_markdown_generator.ts
    │   ├── match_markdown_generator.ts
    │   ├── unmatch_markdown_generator.ts
    │   └── uncover_markdown_generator.ts
    ├── final.ts       # 最终匹配处理
    └── url_branch.ts  # URL分支检测

```

# 数据流向
meituan_filelist_process -> meituan_markdown_generator
meituan_filelist_process -> final
cmb_debitcard_file_process -> final
wechat_file_process -> final
final -> match_markdown_generator
final -> multichannel_markdown_generator
final -> uncover_markdown_generator
final -> unmatch_markdown_generator

# 数据结构变化
## 美团文件解析数据
string -> MeituanOrder[]
## 其他支付渠道解析数据
string -> ChannelDataGroup
## final
ChannelDataGroup + MeituanOrder[] -> FinalOutput
## markdown生成器
MeituanOrder[] -> string
MatchResult[] -> string

# 如何新增渠道
## 代码修改
### 类型文件
新增对应payment类型数据
修改PaymentChannel
修改PaymentData

### url_branch
detectPaymentChannel方法新增新渠道的判断语句以及枚举值

### file_process
channel文件夹下新增根据对应类型数据处理之后（csv xlsx pdf等），完善解析表单数据的函数
根据demo解析数据，更新isOrderMatchPaymentData匹配策略

### final
新增类型守卫函数

### match_markdown
更新generateMatchTable方法

## 工作流修改
### money_data_process
在循环体中修改所有和ts文件名字相同的代码节点
在选择器和变量聚合节点中添加对应的判断分支
根据渠道文件类型新增文件解析器
将对应file_process代码节点添加到解析器后面


# demo数据说明
demo文件夹存放不同类型的账单数据，以及他们经过解析之后的json数据，作为制作单测用例的依据

## 文件格式
每个json文件存放四个字段的数据
- channel 账单类型，一般和文件名一致
- type 文件类型
- name 文件名称
- url 上传coze之后产生的文件url
- string 经过coze对应类型插件解析之后的字符串
- date 从string中解析出的账单起止日期
- data 从string中解析出的账单数据

## 特殊情况
建设银行储蓄卡懒得导账单
中国银行储蓄卡账单是加密文件，无法经过coze处理
支付宝中文乱码


# 开发规范
## 代码节点开发规范
### JavaScript
- 支持 V8 引擎的 11.3.244.8 版本（对应 Node.js 20.3.1 版本），并兼容 ECMAScript 2022 语法。
- 在 JavaScript 中，仅内置了两个三方依赖库：dayjs（版本 1.8.36）lodash（版本 4.17.20） 。
- JavaScript 运行时遵循 WinterCG 规范，并支持一系列 Web API，包括：atob()、btoa()、console、setTimeout()、clearTimeout()、structuredClone()、URL、URLSearchParams、AbortController、AbortSignal、TextEncoder、TextDecoder、WebStreams、WebCrypto（算法仅支持 AES、HMAC、SHA）
### Python
- 基于 Python 3.11.3 的标准库，大多数模块都能正常运行。不支持的模块包括 curses、dbm、ensurepip、fcntl、grp、idlelib、lib2to3、msvcrt、pwd、resource、syslog、termios、tkinter、turtle.py、turtledemo、venv、winreg、winsound、multiprocessing、threading、sockets、pty 和 tty。
- 在 Python 环境中，仅内置了两个第三方依赖库：requests_async 和 numpy。其中，requests_async 与 requests 类似，但在使用时需要搭配 await
- Python 运行时暂不支持 Http.client 方式的请求。
- 不支持使用除 requests_async 、numpy 以外的第三方依赖库。
- time.sleep() 方法由于是阻塞调用，会对代码执行性能产生影响，因此推荐使用异步版本的 asyncio.sleep() 来替代。

## coze插件开发规范
https://www.coze.cn/open/docs/guides/ide
注：插件开发无法使用requests_async这个依赖

# 导出周期
美团 - 3个月
招商银行储蓄卡 - 12个月
信用卡 - 1个月
支付宝 - 3个月？
微信支付 - 3个月？

# 数据解析规律

## 文件名识别规则
- **美团、微信、支付宝**：直接在文件名中识别关键词
- **招商银行储蓄卡**：文件名包含"招商银行交易流水"
- **招商银行信用卡**：文件名格式为"X年X月信用卡账单"
- **广发银行信用卡**：文件名格式为"X年X月综合对账单打印版"

## 数据解析规则

### 美团数据解析（CSV格式）
- **解析起点**：【美团交易账单明细列表】
- **日期解析**：起始时间：[YYYY-MM-DD] 终止时间：[YYYY-MM-DD]
- **数据结构**：表头+数据行，JSON格式嵌套

### 微信数据解析（XLSX格式）
- **日期解析**：起始时间：[YYYY-MM-DD HH:mm:ss] 终止时间：[YYYY-MM-DD HH:mm:ss]
- **解析起点**：----------------------微信支付账单明细列表--------------------
- **数据结构**：标准表格格式，包含表头和数据行

### 支付宝数据解析（CSV格式）
- **日期解析**：起始时间：[YYYY-MM-DD HH:mm:ss]    终止时间：[YYYY-MM-DD HH:mm:ss]（注意多个空格）
- **解析起点**：------------------------支付宝（中国）网络技术有限公司  电子客户回单------------------------
- **数据结构**：表头在分隔线下一行，数据紧随其后

### 招商银行储蓄卡解析（PDF格式）
- **解析起点**：验证码(Verification Code)之后
- **日期解析**：Transaction Statement of China Merchants Bank下一行，格式YYYY-MM-DD -- YYYY-MM-DD
- **数据特点**：一行数据拼接，需特殊分隔规则
  - 日期：YYYY-MM-DD格式
  - 货币：英文缩写(CNY)
  - 金额：两位小数格式
  - 交易摘要和对手信息：可能包含换行符，难以区分
- **时间补全**：开始日期+00:00:00，结束日期+23:59:59

### 招商银行信用卡解析（PDF格式）
- **日期计算**：终止日期=账单日下一行，开始日期=终止日期往前推一个月
- **解析范围**：人民币账户 RMB A/C 下一行开始，本期还款总额上一行结束
- **数据特点**：一行拼接格式
  - 交易日/记账日：MM/DD格式
  - 金额：两位小数，可能包含(CN)标识
  - 交易类型：另起一行标识（\n 还款、\n 退款、\n 消费等）

### 广发银行信用卡解析（PDF格式）
- **日期解析**：账单周期YYYY/MM/DD - YYYY/MM/DD
- **解析范围**：注：若您名下的多张信用卡主卡均有欠款，需分别还款 下一行开始，用卡安全温馨提示： 上一行结束
- **数据特点**：一行拼接，日期YYYY/MM/DD格式，金额两位小数

## 信用卡金额规则
- **招商银行信用卡**：负数表示退款，正数表示消费
- **广发银行信用卡**：负数表示退货/还款，正数表示消费
- 注意：不同银行的正负符号含义可能不同

# 美团退款匹配规则

## 强规则（必须满足）
1. **金额精确匹配**：美团订单金额与支付渠道金额必须完全一致
2. **时间误差范围**：交易时间差在±2小时内

## 弱规则（辅助判断）
1. **关键词匹配**：交易摘要包含"美团"关键词
2. **类型匹配**：交易类型包含"退款"关键词
3. **支付方式匹配**：支付方式信息一致

## 匹配逻辑
- 强规则是匹配的必要条件，必须全部满足
- 弱规则用于提高匹配准确性，部分满足即可
- 优先匹配强规则+弱规则全满足的记录

# 测试规范

## 测试数据管理
- 所有测试数据已完全脱敏，移除姓名、卡号、地址等敏感信息
- 测试数据基于demo真实数据生成，保持业务逻辑完整性
- 使用虚构但合理的测试标识符（TEST开头的各种ID）

## 测试用例覆盖
### Final.ts测试场景
- **完美匹配**：强规则+弱规则全满足
- **边界测试**：时间误差边界（1小时59分59秒 vs 2小时1秒）
- **金额测试**：精确匹配 vs 微小差异（0.01元）
- **未匹配场景**：美团订单无对应支付记录
- **未覆盖场景**：支付记录无对应美团订单
- **弱规则测试**：仅满足强规则的情况
- **信用卡符号测试**：负数表示退款的规则验证

### 数据解析测试
- 各渠道原始数据格式解析
- 日期范围提取和格式化
- 边界情况和异常数据处理
- 文件名识别和渠道检测

# todo
单渠道多卡
非人民币
中行是加密pdf，暂时无法解析
新增其他渠道
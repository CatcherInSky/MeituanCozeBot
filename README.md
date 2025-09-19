# MeituanCozeBot
coze搭建AI智能体，输入美团退款订单数据以及各支付渠道数据，输出未被匹配的订单数据以供向客服申诉

# 项目结构

```
MeituanCozeBot/
├── types/             # 统一类型定义
│   └── index.ts
└──script/
    ├── channel/       # 支付渠道数据处理
    │   ├── wechat_file_process.ts # 微信xlsx文件处理
    │   ├── alipay_file_process.ts # 支付宝csv文件处理
    │   ├── cmb_debitcard_file_process.ts # 招商储蓄卡pdf处理
    │   ├── cmb_creditcard_file_process.ts # 招商信用卡pdf处理
    │   ├── gf_creditcard_file_process.ts # 广发信用卡pdf处理
    │   └── meituan_filelist_process.ts # 美团csv列表处理
    ├── coverage.ts       # 判断未被支付渠道数据覆盖的美团数据
    ├── data.ts       # 合并数据形成统一表格
    └── url_branch.ts  # 分支检测

```

# 数据流向
由process处理不同的支付渠道数据以及美团退款订单数据
由data汇总
由coverage判断未被支付渠道数据覆盖的美团数据
经过prompt判断在被覆盖的退款订单数据中，哪些是未被匹配的

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
支付宝中文乱码为GBK编码


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
微信 - 3个月
支付宝 - 12个月
招商银行储蓄卡 - 12个月
信用卡 - 1个月
# todo
单渠道多卡
非人民币
中行是加密pdf，暂时无法解析
新增其他渠道
美团月付和余额不支持导出记录，只能OCR支持
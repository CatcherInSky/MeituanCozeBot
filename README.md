# MeituanCozeBot
coze搭建AI智能体，输入美团退款订单数据以及各支付渠道数据，输出未被匹配的订单数据以供向客服申诉

# 项目结构

```
MeituanCozeBot/
├── types/             # 统一类型定义
│   └── index.ts
├── nodes/             # 核心业务逻辑节点
│   ├── channel/       # 支付渠道数据处理
│   │   ├── wechat_file_process.ts # 微信xlsx文件处理
│   │   ├── alipay_file_process.ts # 支付宝csv文件处理
│   │   ├── cmb_debitcard_file_process.ts # 招商储蓄卡pdf处理
│   │   ├── cmb_creditcard_file_process.ts # 招商信用卡pdf处理
│   │   ├── gf_creditcard_file_process.ts # 广发信用卡pdf处理
│   │   ├── meituan_balance_file_process.ts # 美团余额图片ocr后数据处理
│   │   └── meituan_filelist_process.ts # 美团csv列表处理
│   ├── table/         # 表格生成器
│   │   ├── channel_markdown.ts # 渠道数据markdown表格
│   │   ├── match_markdown.ts # 匹配数据markdown表格
│   │   ├── meituan_markdown.ts # 美团数据markdown表格
│   │   ├── uncover_markdown.ts # 未覆盖数据markdown表格
│   │   └── unmatch_markdown.ts # 未匹配数据markdown表格
│   ├── analysis.ts    # 数据分析主流程
│   ├── before_download.ts # 下载前处理
│   ├── data.ts        # 数据合并处理
│   └── url_branch.ts  # 分支检测
├── plugins/           # Coze插件
│   ├── csv_parser_node.py # CSV解析器（节点版）
│   ├── csv_parser_plugin.py # CSV解析器（插件版）
│   ├── excel_generator_node.py # Excel生成器（节点版）
│   └── excel_generator_plugin.py # Excel生成器（插件版）
├── dist/              # 编译后的JavaScript文件
├── demo/              # 演示数据和测试用例
├── docs/              # 文档目录
├── markdown/          # Markdown模板
├── prompts/           # 提示词模板
├── scripts/           # 构建脚本
└── test/              # 测试文件

```

# 数据流向
1. **文件上传** → 各支付渠道原始文件（xlsx/csv/pdf）
2. **文件解析** → 通过channel/目录下的process文件解析为统一格式
3. **数据合并** → 通过data.ts汇总所有渠道数据
4. **覆盖分析** → 通过analysis.ts判断未被支付渠道数据覆盖的美团数据
5. **匹配分析** → 在已覆盖的订单中，通过匹配算法找出未匹配的订单
6. **结果输出** → 通过table/目录下的markdown生成器输出分析结果
7. **文件导出** → 通过plugins/目录下的excel生成器导出Excel文件

# 如何新增渠道
## 代码修改
### 类型文件 (types/index.ts)
- 新增对应payment类型数据
- 修改PaymentChannel枚举
- 修改PaymentData联合类型

### 分支检测 (nodes/url_branch.ts)
- detectPaymentChannel方法新增新渠道的判断语句以及枚举值

### 文件处理 (nodes/channel/)
- 新增对应的file_process.ts文件
- 根据文件类型（csv/xlsx/pdf等）完善解析函数
- 根据demo数据更新匹配策略




## 工作流修改
### Coze工作流配置
1. **文件解析节点**：根据渠道文件类型新增对应的文件解析器
2. **代码节点**：添加对应的file_process.ts代码节点到解析器后面
3. **分支选择器**：在url_branch节点中添加新渠道的判断分支
4. **数据聚合**：确保新渠道数据能正确聚合到最终结果中
5. **输出节点**：根据需要添加对应的markdown生成器节点


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


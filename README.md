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
# 代码节点开发规范
## JavaScript
- 支持 V8 引擎的 11.3.244.8 版本（对应 Node.js 20.3.1 版本），并兼容 ECMAScript 2022 语法。
- 在 JavaScript 中，仅内置了两个三方依赖库：dayjs（版本 1.8.36）lodash（版本 4.17.20） 。
- JavaScript 运行时遵循 WinterCG 规范，并支持一系列 Web API，包括：atob()、btoa()、console、setTimeout()、clearTimeout()、structuredClone()、URL、URLSearchParams、AbortController、AbortSignal、TextEncoder、TextDecoder、WebStreams、WebCrypto（算法仅支持 AES、HMAC、SHA）
## Python
- 基于 Python 3.11.3 的标准库，大多数模块都能正常运行。不支持的模块包括 curses、dbm、ensurepip、fcntl、grp、idlelib、lib2to3、msvcrt、pwd、resource、syslog、termios、tkinter、turtle.py、turtledemo、venv、winreg、winsound、multiprocessing、threading、sockets、pty 和 tty。
- 在 Python 环境中，仅内置了两个第三方依赖库：requests_async 和 numpy。其中，requests_async 与 requests 类似，但在使用时需要搭配 await
- Python 运行时暂不支持 Http.client 方式的请求。
- 不支持使用除 requests_async 、numpy 以外的第三方依赖库。
- time.sleep() 方法由于是阻塞调用，会对代码执行性能产生影响，因此推荐使用异步版本的 asyncio.sleep() 来替代。


# 数据流向
meituan_filelist_process -> meituan_markdown_generator
meituan_filelist_process -> final
cmb_debitcard_file_process -> final
wechat_file_process -> final
final -> match_markdown_generator
final -> multichannel_markdown_generator
final -> uncover_markdown_generator
final -> unmatch_markdown_generator

# 如何新增渠道
## 代码修改
### url_branch
新增新渠道的判断语句以及枚举值

### file_process
根据对应类型数据处理之后（csv xlsx pdf等），完善解析表单数据的函数

### final

### match_markdown


## 工作流修改
### money_data_process
在循环体中修改所有和ts文件名字相同的代码节点
在选择器和变量聚合节点中添加对应的判断分支
根据渠道文件类型新增文件解析器
将对应file_process代码节点添加到解析器后面

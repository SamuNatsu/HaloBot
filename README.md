# HaloBot

一款基于异步 Typescript 的 go-cqhttp 机器人框架，支持插件系统并提供了高级抽象封装

## 插件开发

文档请见：https://github.com/SamuNatsu/HaloBot/tree/master/plugins

## 机器人搭建的前置要求

你需要自定准备一个 Go-CqHttp 服务作为后端使用，具体请见：https://github.com/Mrs4s/go-cqhttp

Go-CqHttp 是与 QQ 进行交互的核心，它实现了各种 QQ 协议和 QQ 操作，并暴露一些 HTTP/WS 服务来供使用者调用

HaloBot 是基于 Go-CqHttp 的 NodeJS 机器人框架，它在后端会调用 Go-CqHttp 的服务来与 QQ 交互

HaloBot 除了提供基础的 Go-CqHttp 与 JavaScript/TypeScript 的语言绑定以外，还提供了 JavaScript 插件功能，使得使用者可以方便地开发 QQ 机器人

## 构建

用你喜欢的 NodeJS 包管理器，以 `pnpm` 为例：

```bash
# 安装依赖
pnpm i

# 构建项目
pnpm run build

# 运行测试
pnpm run dev
```

## 部署

将构建生成的 `build` 文件夹拷贝出来，这个文件夹就是最终 HaloBot 的运行目录，你可以给他改成别的名字。

然后安装依赖，以 `pnpm` 为例：

```bash
pnpm i -P
```

最后你需要按照**下一节**的说明编写配置文件，然后使用以下命令就能启动了：

```bash
node HaloBot.min.mjs
```

## 配置

```yaml
# Go-CqHttp 连接设置
connection:
  # 连接类型，可以为 none、http、websocket 和 fake
  type: none
  # 在使用 none 作为连接时，将不连接任何 Go-CqHttp 服务，可以用于调试，所有发送的请求都会自动失败，同样这也意味着你接收不到任何请求

  # type: http
  # 在使用 http 作为连接时，表示你将使用双向 HTTP 来连接 Go-CqHttp 服务，你需要新增一个项 config 填写配置内容
  # config:
  #   # 正向 HTTP 连接 URL，必须
  #   http_forward: http://127.0.0.1:12345
  #   # 反向 HTTP 端口，必须
  #   http_reverse_port: 54321

  # type: websocket
  # 在使用 websocket 作为连接时，表示你将使用 WebSocket 来连接 Go-CqHttp 服务，你需要新增一个项 config 填写配置内容
  # config:
  #   # WebSocket 连接类型，可以为 forward 或 reverse，表示正向/反向 WebSocket 连接
  #   ws_type: forward
  #   # 当使用正向 WebSocket 时，必须填写以下正向连接 URL
  #   # ws_forward: ws://127.0.0.1:12345
  #   # 当使用反向 WebSocket 时，必须填写以下反向端口
  #   # ws_reverse_port: 54321

  # type: fake
  # 在使用 fake 作为连接时，HaloBot 将建立一个 HTTP 服务器，让你来模拟 Go-CqHttp 收发相关报文，你需要新增一个项 config 填写配置内容
  # config:
  #   # HTTP 服务器端口
  #   fake_reverse_port: 54321
```

## Fake 连接

HaloBot 提供了一种连接类型叫 Fake，其会在本地开启一个 HTTP 服务器，用户可以使用 CURL 等软件向服务器发送报文来模拟 Go-CqHttp，这是一种调试方法。

它有两个 API，都需要使用 `POST` 协议，且 `Content-Type` 必须为 `application/json`：

### /event

发送一个事件上报，结构请见 Go-CqHttp 相关文档。

### /response

发送一个 API 回复，结构请见 Go-CqHttp 相关文档。

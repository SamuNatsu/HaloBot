# HTML 渲染器

## NodeJS 依赖安装

插件除了 HaloBot 自带依赖以外，还需要安装 `async` 和 `puppeteer` 两个包

使用你喜欢的包管理器安装，此处以 `pnpm` 为例：

```bash
pnpm i async puppeteer
```

## 额外依赖安装

由于 HTML 渲染使用的 `puppeteer` 是基于 Chromium 的，所以你可能还需要安装其他的二进制依赖。

如果你使用 Windows/Mac 系统，那么只要你安装了以 Chromium 为内核的浏览器，就可以使用 `puppeteer`，否则你需要先安装相关的浏览器。

如果你使用的是 Linux，你可以选择安装以 Chromium 为内核的浏览器，也可以不安装浏览器，而是选择安装缺少的二进制库，具体列表你可以自行查找 Chromium 依赖库。

## 配置

修改 `config.yaml` 来应用你需要的配置，如果你在 HaloBot 运行期间修改了配置，那么你需要重启插件。

## 使用

HTML 渲染器只能通过插件间调用来使用，作为一个服务端为其他插件提供服务。

如果你需要在某个插件中使用 HTML 渲染器，你需要调用 `this.bot.callPluginMethod` 向渲染器发起调用请求。

渲染方法名为 `render`，参数定义如下：

|参数|类型|描述|默认值|
|:----:|:----:|:----:|:----:|
|type|string|渲染对象的类型，必须是 "file" 或 "text"|-|
|viewport|?object|渲染窗口大小对象|undefined|
|viewport.width|number|渲染窗口宽度，以像素为单位|800|
|viewport.height|number|渲染窗口高度，以像素为单位|600|
|action|?function|一个函数，将会传入一个由 `puppeteer` 生成的 `Page` 对象，表示当前渲染的页面，你可以使用这个函数来操作这个页面以获得更多自定义支持|undefined|
|target|string|渲染对象字符串，`type` 为 "file" 则是一个以 "file://" 开头的路径字符串；如果 `type` 为 "text" 则是一个 HTML 字符串|-|
|path|string|输出文件路径|-|

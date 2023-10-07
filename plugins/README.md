# 官方插件列表

你可以将它们拷贝到真正的 `plugins` 目录下使用

|文件夹|名字|介绍|
|----|----|----|
|html_renderer|HTML 渲染器|将 HTML 文件或字符串渲染成图片|
|stable_diffusion|StableDiffusion 画图插件|基于 WebUI 的生成插件|

## 插件开发文档

你的插件应该放在 `plugins` 目录下，并且以文件夹的形成存在，文件夹可以是任意名字，但是如果文件夹名以下划线开头，则 HaloBot 会忽略该文件夹：

```txt
-- plugins
   +-- p1  # 会被加载
   +-- _p2 # 会被忽略
```

在你的插件目录下，应该有一个名为 `index.js` 的文件，这个文件是插件的加载入口：

```txt
-- plugins
   +-- my_plugin
       +-- index.js # 插件加载入口
```

你必须使用 ESM 模块格式来书写插件，并且在插件中导出一个默认对象，这个对象就是插件本体，并且至少包含一个 `meta` 属性标识插件的元信息：

```js
/// index.js

export default {
  meta: {
    namespace: 'my_plugin', // 插件名字空间，只能包含使用点号分隔的标识符格式，如：a.b.c、abc.efg 或者就是单纯的 abc。每个标识符不能以数字开头，合法字符集只有数字、大小写字母、点号和下划线
    name: 'My Plugin', // 插件名字
    author: 'Me', // 插件作者
    description: 'My plugin', // 插件描述
    priority: 50, // 插件加载优先级，1~100 的整数
    version: '1.0.0', // 插件版本，只能使用“大版本数字.小版本数字.修改版本数字”的格式，并且不允许多个前缀 0
    botVersion: '1.0.0' // 插件最低要求的 HaloBot 版本，这个参数目前暂时没用，但是仍然会进行校验
  }
};
```

如果你使用的编辑器有类型提示功能，那么你可以导入一个帮助函数 `definePlugin` 来获得你需要的类型提示功能，**我们非常推荐你使用这种方式**：

```js
/// index.js
import { definePlugin } from '../../HaloBotPlugin.js';

// 现在你可以获得类型提示
export default definePlugin({
  meta: {
    namespace: 'my_plugin',
    name: 'My Plugin',
    author: 'Me',
    description: 'My plugin',
    priority: 50,
    version: '1.0.0',
    botVersion: '1.0.0'
  }
});
```

在你的插件被载入时，`onStart` 函数会被触发，被卸载时，`onStop` 函数会被触发；如果你没有提供这两个函数，那么什么也不会发生，也不会报错：

```js
/// index.js
import { definePlugin } from '../../HaloBotPlugin.js';

export default definePlugin({
  meta: {
    namespace: 'my_plugin',
    name: 'My Plugin',
    author: 'Me',
    description: 'My plugin',
    priority: 50,
    version: '1.0.0',
    botVersion: '1.0.0'
  },
  onStart() {
    console.log('Plugin started');
  },
  onStop() {
    console.log('Plugin stopped');
  }
});
```

当你的插件被载入时，插件会被注入几个属性供你使用，它们可以极大地方便你开发插件，你不需要预定义它们：

```js
/// index.js
import { definePlugin } from '../../HaloBotPlugin.js';

export default definePlugin({
  meta: {
    namespace: 'my_plugin',
    name: 'My Plugin',
    author: 'Me',
    description: 'My plugin',
    priority: 50,
    version: '1.0.0',
    botVersion: '1.0.0'
  },
  onStart() {
    this.api; // 这个属性包含了所有你等调用的 HaloBot API 以及 QQ API，它们被打包成了一个对象
    this.logger; // 这个属性是提供给插件的日志记录器，你可以使用 trace、info、warn 等成员函数来输出日志，所以我们不推荐在插件中使用 console.log
    this.currentPluginDir; // 这个属性是当前插件的文件夹路径字符串
    this.db; // 这个属性是当前插件的本地数据库对象，你可以随意使用它，这是使用 knex.js 提供的 SQL 访问器，具体请见：https://knexjs.org/
  }
});
```

如果你使用了 `definePlugin` 函数来定义插件，那么你可以获得类型提示，这些类型提示已经非常详细了，可以帮你得知插件开发的其他事件触发器和使用方法了，请善用它

插件所有的事件触发器都是以 `on` 开头的成员函数：

```js
/// index.js
import { definePlugin } from '../../HaloBotPlugin.js';

export default definePlugin({
  meta: {
    namespace: 'my_plugin',
    name: 'My Plugin',
    author: 'Me',
    description: 'My plugin',
    priority: 50,
    version: '1.0.0',
    botVersion: '1.0.0'
  },
  onStart() {}, // 启动事件触发器
  onPrivateMessage(ev) {}, // 私聊事件触发器
  // ... 还有很多，你可以自行探索
});
```

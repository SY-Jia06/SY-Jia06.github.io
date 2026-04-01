# Debug Notes

这个文件记录这个博客项目里已经踩过、并且容易反复出现的问题。

目标不是写成长文，而是降低之后继续修改时的认知负债。

## 1. 文章直达链接不要优先用 `#hash`

### 现象

- 在聊天里点 `http://localhost:8765/blog.html#some-post`
- 有时会被错误处理成服务器路径，出现 404
- 或者浏览器 / 客户端对 hash 的处理不一致

### 原因

- `#hash` 本来应该只在浏览器端处理
- 但某些客户端、可点击链接组件、预览环境会把它处理得不稳定

### 现在的约定

- 对外给链接时，优先使用：

```txt
blog.html?post=<post-id>
```

- 例如：

```txt
http://localhost:8765/blog.html?post=spectacle-society
```

### 代码位置

- `/Users/j/工作区/Projects/claude/找工作/Java/BLOGs/blog/blog-app.js`
- 关键函数：
  - `getDirectPostId()`
  - `buildCurrentUrl()`

## 2. front matter 不能渲染进正文

### 现象

文章开头直接出现：

```txt
title: ...
date: ...
category: ...
tags: ...
summary: ...
coverLabel: ...
coverTone: ...
```

### 原因

- Markdown 文件本身带有 front matter
- 渲染正文时如果没先剥离 front matter，`marked` 会把它当普通文本渲染

### 固定解法

- 在真正渲染正文前，先调用 `stripFrontMatter(markdown)`
- 再做：
  - 提取首图
  - 去掉首图
  - `marked.parse(...)`

### 代码位置

- `/Users/j/工作区/Projects/claude/找工作/Java/BLOGs/blog/blog-app.js`
- 关键函数：

```js
function stripFrontMatter(markdown) {
    return markdown.replace(/^---\\s*\\r?\\n[\\s\\S]*?\\r?\\n---\\s*\\r?\\n/, "");
}
```

## 3. 浏览器左上角返回必须回到进入前的位置

### 现象

- 从博客列表点进文章
- 再点浏览器左上角返回
- 只回到列表顶部，或者只是切换当前文章视图，不回原来的滚动位置

### 期望

- 返回后应该回到“刚刚点进去前”的列表滚动位置

### 固定解法

- 打开文章前先记住：

```js
lastListScrollY = window.scrollY;
```

- 再通过 `history.replaceState()` / `history.pushState()` 把列表状态和滚动位置写进去
- `popstate` 时恢复列表视图，并用保存的 `scrollY` 滚回原位

### 代码位置

- `/Users/j/工作区/Projects/claude/找工作/Java/BLOGs/blog/blog-app.js`
- 相关变量和函数：
  - `lastListScrollY`
  - `initHistoryState()`
  - `openPostInternal()`
  - `closePostView()`

## 4. 封面不是强制项

### 现在的约定

- 每篇博客不必强制配封面图
- 如果正文第一张图存在：
  - 拿第一张图做文章 Hero 背景
- 如果正文没有图：
  - 使用默认 Hero 背景

### 代码位置

- `/Users/j/工作区/Projects/claude/找工作/Java/BLOGs/blog/blog-app.js`
- 相关函数：
  - `extractFirstImage()`
  - `removeLeadingImage()`

## 5. Notion 文章迁移流程

### 推荐流程

1. 从 Notion 拉内容
2. 落成 `posts/<Category>/<slug>.md`
3. 补 front matter
4. 运行索引生成脚本

```bash
node scripts/generate-posts.js
```

### 注意

- 迁移过来的正文不要把 front matter 和正文混在一起
- 迁移后一定要刷新：
  - `posts.js`
  - `search.json`

## 6. Cloudflare 里要分清 Pages 和 Worker

### 错误路径

- 把静态博客部署成 Worker
- 结果 `workers.dev` 只返回 `hello`

### 正确认知

- 这个项目是纯静态站
- 适合：
  - GitHub Pages
  - Cloudflare Pages
- 不需要 Worker 逻辑

### 如果必须临时用 Cloudflare

- 优先 Pages
- 或者直接上传静态文件

## 7. 本地预览默认端口

### 约定

默认使用：

```txt
http://localhost:8765/
```

### 如果打不开

先检查：

```bash
lsof -nP -iTCP:8765 -sTCP:LISTEN
```

如果端口被占但访问异常，再检查当前监听进程和工作目录是否正确。

### 标准启动方式

在博客根目录执行：

```bash
cd /Users/j/工作区/Projects/claude/找工作/Java/BLOGs/blog
python3 -m http.server 8765
```

如果提示：

```txt
OSError: [Errno 48] Address already in use
```

说明 8765 已经有服务在监听，不一定是坏事，先直接访问：

```txt
http://localhost:8765/
```

### 重要提醒

- 聊天里的 `http://localhost:8765/blog.html#xxx` 链接有时会被客户端错误处理
- 对外优先给：

```txt
http://localhost:8765/blog.html?post=<post-id>
```

- 例如：

```txt
http://localhost:8765/blog.html?post=spectacle-society
```

## 8. 修改博客功能后，最少做这几个检查

```bash
node --check script.js
node --check blog-app.js
node --check simple-page.js
node --check theme.js
node scripts/generate-posts.js
```

如果改的是文章阅读逻辑，还要手动检查：

- 从列表进入文章
- 浏览器左上角返回
- 页面内“返回博客列表”
- `?post=` 直达
- 无图文章 / 有图文章

## 8.5 Push 前的默认流程

以后只要是页面或样式改动，准备 push 之前默认执行：

1. 先启动或确认本地预览服务正常
2. 直接打开对应本地页面给用户过目
3. 用户确认之后再 push

也就是说：

- 不等用户额外提醒
- 先本地打开
- 再决定是否提交 / 推送

## 8.6 这次前端排障里最有用的经验

### 先分清是“逻辑错”还是“布局错”

- 目录高亮滞后，属于逻辑问题
- 文章正文被挤窄，属于布局问题

不要把这两类问题混着猜。先分层，再下手。

### 滚动高亮问题，本质上是在调“激活线”

如果正文已经进入新的 `h2`，目录却还停留在上一个 `h3`，通常不是数据错，而是“当前激活标题”的判断线太靠上或太靠下。

固定做法：

- 把“激活标题”判断提成单独逻辑
- 明确一个 activation band
- 用测试锁住“新的 `h2` 进入这条带后就该接管高亮”

### CSS Grid 里不要随便把整列节点隐藏掉

这次最典型的坑：

- 左右侧栏本来占了 grid 轨道
- 直接把某个侧栏节点 `hidden`
- 正文就自动补位到窄列里，导致文章被压扁

固定做法：

- 尽量隐藏侧栏内部面板
- 不要直接把整个 grid item 移出布局流
- 除非你同时重算整个 grid 模板

### 目录显示规则要分左右侧

全文目录和局部子目录不是一个层级，不能用同一套显示阈值。

现在的约定更合理：

- 左侧全文目录：只要有 `h2` 就显示
- 右侧本节子目录：当前 `h2` 下有 `h3` 才显示

否则短文会完全没有目录，长文又会让右侧空掉或重复。

### 深色模式好看的侧栏，不代表浅色模式也能看

这次侧栏在深色模式下没问题，切到浅色模式几乎隐形。

原因不是功能坏了，而是：

- 半透明浅面板
- 低对比文字
- 放在浅背景上直接失去边界

固定做法：

- 浅色模式和深色模式分别给侧栏设对比度策略
- 深色可以更淡
- 浅色必须更实、更有边线

### 视觉问题优先看截图，不要只看代码

很多问题不是从代码里直接看出来的，而是从截图里判断：

- 是正文没居中
- 是侧栏被裁切
- 是右栏消失导致视觉失衡
- 还是对比度不够

前端调试里，截图往往比口头描述更快定位。

### 缓存永远值得怀疑

如果“明明改了但页面像没变”，先别怀疑人生，先怀疑缓存。

固定做法：

- CSS/JS 改动后更新版本号
- 本地强刷 `Cmd+Shift+R`
- 再判断是不是逻辑真的没生效

## 9. 当前项目内的重要约定

- 首页和项目页在 `index.html`
- 关于我是独立页 `about.html`
- 博客列表和阅读页在 `blog.html`
- 文章数据索引不是手写，靠：

```txt
scripts/generate-posts.js
```

- 文章列表对外统一叫“博客”，不是“文章列表”

## 10. 两侧目录消失 ≠ 功能被删，先量视口宽度

### 现象

- 改完代码后打开文章，发现左侧全文目录和右侧本节子目录全部不见了
- 第一反应以为是代码改动误删了 TOC 逻辑

### 真正原因

`reading-enhancements.js` 里有一个响应式守卫：

```js
function shouldRenderDesktopSidebars(viewportWidth) {
    return viewportWidth > 980;
}
```

当浏览器窗口宽度 ≤ 980px 时，两侧目录会被主动隐藏（`toc.hidden = true`），这是**设计行为**，不是 bug。

最常见的触发场景：**一边开编辑器/聊天窗口，一边把浏览器分屏测试**。分屏后浏览器宽度通常只剩 700-800px，必然低于 980px 阈值。

### 排查方法

1. 把浏览器窗口**最大化**或拉到 > 980px 宽
2. 目录立刻回来 → 说明是视口宽度问题，不是代码回退
3. 最大化后仍然没有 → 那才是真的代码出了问题，再去查 `reading-enhancements.js` 和 `blog.html` 中的 `#postToc` / `#postSubtoc` 容器

### 教训

前端"功能消失"类 bug 排查顺序：

1. **环境因素**：视口宽度、缓存、DevTools 模拟设备
2. **CSS 层**：`display: none` / `hidden` / `visibility` / 媒体查询
3. **JS 逻辑**：才去怀疑是不是代码真的被改坏了

不要跳过前两步直接进第三步。

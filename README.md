# 宋如一 · 学习委员竞选

一套五页的像素田园风网页演示，文案按班级竞选口语编写。以原创山谷、书屋和木框手札营造轻松的竞选氛围，正文保持清晰可读。

[在线演示](https://124-221-36-36.anyip.dev:8443/study-committee/)

## 演示操作

- 左右方向键、PageUp / PageDown 翻页；空格下一页；Home / End 跳转首页与末页。
- F 全屏，Esc 退出；底部章节按钮可直接跳转，`#5` 可分享指定页面。
- 手机支持左右滑动，长内容可上下滚动。
- 右上角切换昼夜、暂停或启用动效。暂停偏好保存在当前浏览器。
- 系统开启“减少动态效果”时自动关闭运动效果。隐藏标签页暂停动画与粒子循环。
- 浏览器打印可输出五页横向内容，建议开启背景图形。

## 内容与素材

姓名为宋如一，班级待填写。内容是待本人确认的竞选发言草稿；未填写成绩、获奖或任职经历。正文在 `index.html`，可编辑资料在 `app.js` 的 `profile`。

背景 `assets/learning-valley.png` 使用 ImageGen 为本项目生成：原创像素山谷、书屋与菜园，无游戏原作素材或人物。

标题与章节使用 [Fusion Pixel](https://github.com/TakWolf/fusion-pixel-font) 的简体中文 12px 比例字体，版本 `2026.09.01`，文件内容未经修改，仅简化文件名。主字体与其来源字体的授权文本保留在 `assets/LICENSES/`。正文使用系统字体。此项目不依赖字体 CDN。

## 本地运行

在目录内运行 `python -m http.server 8086 --bind 127.0.0.1`，访问 `http://127.0.0.1:8086`。也可以直接打开 `index.html`。

原生 HTML / CSS / JavaScript，无构建流程与运行时第三方依赖。Canvas 粒子限制约 30 fps，最多 55 个环境粒子；鼠标视差幅度保持很小，文字表面不跟随倾斜。

## 文件

- `index.html`：五页内容与导航。
- `style.css`：木框手札、像素字体、响应式布局、环境光、打印样式。
- `app.js`：翻页、方向转场、昼夜、粒子、动态效果偏好与全屏。
- `assets/`：背景、字体和授权文本。
- `tests/verify.cjs`：使用已有 Playwright + Chrome 做浏览器验证。
- `DESIGN.md`：改版范围和设计决策。
- `speech.md`：与页面对应的口语发言稿及写作参考。

## 验证

```powershell
node --check app.js
# 指向已有的 Playwright 模块，无需修改项目依赖。
$env:PLAYWRIGHT_MODULE = '你的 Playwright 模块绝对路径'
node tests/verify.cjs
```

`BASE_URL` 可切换验证地址；`SCREENSHOT_DIR` 可保存逐页截图。验证覆盖六种视口下的五页内容、溢出、键盘与滑动翻页、快速连续转场、深链接、昼夜、暂停记忆、减少动态效果、全屏、打印可见性以及浏览器/资源错误。

## 腾讯云更新与回滚

网站由服务器 Caddy 的 `/study-committee/` 子路径提供，站点目录 `/srv/study-committee`。更新前备份原目录，再上传 `index.html`、`style.css`、`app.js` 与 `assets/`。不需要重启后端服务，也不需要改动其他站点路由。回滚时从此次备份恢复同名静态文件。不要将服务器凭据放进仓库。

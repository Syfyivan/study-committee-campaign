# 宋如一 · 学习委员竞选

一套五页的学习委员竞选网页演示，文案按班级竞选口语编写。提供简约蓝白、活力贴纸、深色科技、像素田园四套风格；内容一致，字体、背景、卡片和装饰各有区别。

[在线演示](https://124-221-36-36.anyip.dev:8443/study-committee/)

## 演示操作

- 左右方向键、PageUp / PageDown 翻页；空格下一页；Home / End 跳转首页与末页。
- F 全屏，Esc 退出；底部章节按钮可直接跳转，`#5` 可分享指定页面。
- 每一页适配当前窗口，不需要上下滚动；手机支持左右滑动翻页。
- 右上角「换风格」打开四套缩略预览，点击立即切换，保留当前页码。默认简约蓝白，浏览器会记住上次选择；Esc 关闭选择面板。
- 切换后地址会带上 `?theme=clean`、`playful`、`midnight` 或 `valley`，复制地址即可分享相同风格与页码。链接中有效的风格优先于浏览器记忆。
- 右上角切换昼夜、暂停或启用动效。暂停偏好保存在当前浏览器。
- 系统开启“减少动态效果”时自动关闭运动效果。隐藏标签页暂停动画与粒子循环。
- 浏览器打印可输出五页横向内容，建议开启背景图形。

## 内容与素材

姓名为宋如一，班级待填写。内容是待本人确认的竞选发言草稿；未填写成绩、获奖或任职经历。正文在 `index.html`，可编辑资料在 `app.js` 的 `profile`。

背景 `assets/learning-valley.png` 使用 ImageGen 为本项目生成：原创像素山谷、书屋与菜园，无游戏原作素材或人物。

像素田园主题的标题与章节使用 [Fusion Pixel](https://github.com/TakWolf/fusion-pixel-font) 的简体中文 12px 比例字体，版本 `2026.09.01`，文件内容未经修改，仅简化文件名。主字体与其来源字体的授权文本保留在 `assets/LICENSES/`。其余主题和正文使用系统字体。此项目不依赖字体 CDN。

## 本地运行

在目录内运行 `python -m http.server 8086 --bind 127.0.0.1`，访问 `http://127.0.0.1:8086`。也可以直接打开 `index.html`。

原生 HTML / CSS / JavaScript，无构建流程与运行时第三方依赖。视口变化时先调整布局，极小窗口再按内容尺寸等比适配，防止文字裁切。Canvas 粒子限制约 30 fps，最多 55 个环境粒子；鼠标视差幅度保持很小，文字表面不跟随倾斜。

## 文件

- `index.html`：五页内容与导航。
- `style.css`：木框手札、像素字体、响应式布局、环境光、打印样式。
- `themes.css`：三套新风格的字体、色彩、卡片与排印动效，复用单屏适配。
- `theme-picker.css`：风格选择面板、缩略预览和手机布局。
- `app.js`：风格选择与记忆、翻页、转场、昼夜、粒子、动态效果偏好与全屏。
- `assets/`：背景、字体和授权文本。
- `tests/verify.cjs`：使用已有 Playwright + Chrome 做浏览器验证。
- `tests/themes.cjs`：四套风格的边界、切换、焦点、链接和持久化验证。
- `DESIGN.md`：改版范围和设计决策。
- `speech.md`：与页面对应的口语发言稿及写作参考。

## 验证

```powershell
node --check app.js
# 指向已有的 Playwright 模块，无需修改项目依赖。
$env:PLAYWRIGHT_MODULE = '你的 Playwright 模块绝对路径'
node tests/verify.cjs
node tests/themes.cjs
```

`BASE_URL` 可切换验证地址；`SCREENSHOT_DIR` 可保存截图。验证覆盖四种风格、九种视口和五页内容的 180 个组合，检查单屏适配、内容与控件边界、风格切换与记忆、分享链接、对话框键盘与焦点。原有验证还包括键盘与滑动翻页、快速连续转场、昼夜、暂停记忆、减少动态效果、全屏、打印可见性以及浏览器/资源错误。

## 腾讯云更新与回滚

网站由服务器 Caddy 的 `/study-committee/` 子路径提供，站点目录 `/srv/study-committee`。更新前备份原目录，再上传 `index.html`、`style.css`、`themes.css`、`theme-picker.css`、`app.js` 与 `assets/`。不需要重启后端服务，也不需要改动其他站点路由。回滚时恢复备份目录。不要将服务器凭据放进仓库。

# 桌宠素材

使用内置 **ImageGen** 按原创角色提示生成，没有使用 CLI、下载角色素材或程序修图。

| 文件 | 主题 / 角色 | 实际尺寸 |
| --- | --- | --- |
| `clean.png` | 简约蓝白 / 小蓝，蓝围巾海豹 | 1254 × 1254 RGBA |
| `playful.png` | 活力贴纸 / 贴贴，奶油黄小猫 | 1254 × 1254 RGBA |
| `midnight.png` | 深色科技 / 小芯，青光机器人 | 1254 × 1254 RGBA |
| `valley.png` | 像素田园 / 啾啾，叶帽背包小鸡 | 1254 × 1254 RGBA |
| `forest.png` | 森野手账 / 小栗，绿围巾猫头鹰 | 1254 × 1254 RGBA |
| `ocean.png` | 海盐晴空 / 泡泡，水手领海獭 | 1254 × 1254 RGBA |
| `lunar.png` | 星月剧场 / 月月，星星胸针月兔 | 1254 × 1254 RGBA |

每张图为 2 × 2 四帧：左上待机闭嘴，右上说话，左下指向，右下开心。保留生成器输出的真实透明 alpha。虽然提示请求 1024 方图，实际输出为 1254 方图；前端按百分比取帧，不依赖绝对像素尺寸。帧间姿态和基线存在细微变化。

完整生成提示与机器人、小鸡的内置编辑提示：

- [海豹与小猫](clean-playful-prompts.json)
- [机器人与小鸡](midnight-valley-prompts.json)
- [猫头鹰与海獭](../themes/forest-prompts.json)
- [月兔](../themes/ocean-lunar-prompts.json)

小尺寸显示、CSS 取帧与动效实现位于项目根目录 `pet.css` / `pet.js`；改变图像时需要同时保留四帧顺序。

新增三款的配色位于 `themes-collection.css`；月兔四帧有位置差异，使用 CSS 位移对齐身体和脚底，原始图像未修改。

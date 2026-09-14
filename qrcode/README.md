# 隐藏二维码传字工具

独立静态页面，部署路径 `/qrcode/`。不在主页、导航或站点地图中添加入口。
页面设置 `noindex, nofollow, noarchive`；这是不公开展示入口的工具页，不是需要登录的私密页面。

直接打开 `index.html`，或通过网站 HTTPS 链接访问。无需构建，脚本、样式、二维码与压缩库全部位于本目录；无 CDN、分析脚本、上传、自动保存或运行时网络请求。网页加载完成后，可断网继续使用；首次在线访问仍需要从网站加载静态文件。也可以保留整个目录后本地打开。

## 使用

粘贴文字 → 生成并播放 → 在另一台 Windows 电脑运行 OfflineQR.exe，打开摄像头接收 → 完成后复制。

- UTF-8 原始文字最多 2 MiB。
- 默认 800 ms/片，可调整间隔、暂停、上一片、下一片、全屏放大。
- 修改文字会清除旧二维码，防止误传旧内容；需重新生成。
- 页面进入后台会暂停，回来后手动继续。
- 同一任务循环播放，接收端自动去重、按序重组、补齐漏片和校验。

## 与 OfflineQR.exe 的协议兼容性

每个二维码使用 Byte 模式、M 纠错级别、至少四模块白边，负载格式：

```
OQ1|SHA256小写十六进制|D或R|从0开始的片号|总片数|Base64片段
```

SHA-256 针对原始 UTF-8 字节。D 表示 raw DEFLATE（与 .NET DeflateStream 一致，不含 zlib/gzip 包装），R 表示原始字节。仅当压缩更小时使用 D。对待发送字节整体 Base64 编码，再按 480 字符分片。

已经与 qrcode-transfer 项目的原始 `src/Protocol.cs` 和 ZXing.Net 进行互操作验证：中文/emoji/换行、未压缩和压缩内容、25 片长文本、逆序与重复分片、SHA-256 校验，以及实际网页 canvas 截图解码。浏览器验证涵盖空输入、超限、播放/暂停/逐片、修改后重置、全屏、移动端和断网操作。

## 本地依赖

- `vendor/qrcode.js`：qrcode-generator 1.4.4，MIT；https://github.com/kazuhikoarase/qrcode-generator
- `vendor/fflate.js`：fflate 0.8.2，MIT；https://github.com/101arrowz/fflate
- 对应许可证保存在同目录 `.LICENSE` 文件中。

哈希使用浏览器 Web Crypto，需要 HTTPS、localhost 或支持 Web Crypto 的本地文件环境。建议使用现代 Edge / Chrome / Firefox。

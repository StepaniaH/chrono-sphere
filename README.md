# ChronoSphere - 高精度时区感知日期计算器

ChronoSphere（时空之轮）是一款纯客户端日期计算工具，面向跨时区日期偏移、日期区间、夏令时审计和中国农历换算等场景。所有计算都在浏览器本地完成，不需要登录，也不会上传用户输入。

[GitHub Repository](https://github.com/StepaniaH/chrono-sphere)

---

## 核心功能

### 日期偏移计算
- 输入基准日期，计算向前或向后偏移 X 日后的公历与农历日期。
- 支持「间隔 X 日」（D + X）与「第 X 日」（D + X - 1）两种常见计数口径。
- 显示目标日期的星期、UTC 偏移、时区缩写和夏令时状态。

### 日期区间计算
- 支持起始日期和结束日期分别选择不同国家/地区时区。
- 同时展示本地日历天数差和跨时区绝对流逝时间。
- 支持包括首尾日、仅包括首日、仅包括尾日、不包括首尾日四种规则。
- 统计区间内工作日与双休日数量，并对反向区间保持清晰提示。

### 时区搜索与 DST 审计
- 可按国家、城市或 IANA 时区搜索，例如中国、美国、伦敦、Sydney。
- 自动扫描计算范围内的夏令时转换事件，标记时钟拨快或拨慢带来的日期影响。

### 中国农历计算
- 支持输入农历年、月、日和闰月，换算对应公历日期并继续做日期偏移。
- 展示干支生肖、节气、节日，以及黄历宜忌信息。
- 月份和日期选择会尽量避免无效农历日期。

### 双语与主题
- 支持简体中文和英文界面。
- 支持浅色、深色以及系统主题跟随。

---

## 隐私说明

- ChronoSphere 不包含后端 API，日期、时区、农历和 DST 计算都在浏览器本地完成。
- 应用不要求登录，不写入远端数据库，不主动上传用户输入的日期、时区或查询内容。
- 偏好设置只存储语言和主题这类本地 UI 设置。

---

## 本地开发

本项目使用 React + TypeScript + Vite 构建，主要依赖 `luxon` 处理时区，`lunar-javascript` 处理农历。

```bash
npm install
npm run dev
```

启动后打开终端输出的本地地址，通常是 `http://localhost:5173/`。

生产构建：

```bash
npm run build
```

本地预览生产构建：

```bash
npm run preview
```

---

## 自托管部署

ChronoSphere 是静态站点，构建产物位于 `dist/`。在 Caddy、Nginx 或其他静态文件服务中托管该目录即可。由于它是单页应用，建议服务端把未知路径回退到 `index.html`。

Caddy 的配置可保持简洁：

```caddyfile
example.com {
  root * /path/to/chrono-sphere/dist
  try_files {path} /index.html
  file_server
}
```

---

## License

MIT License. See [LICENSE](LICENSE).

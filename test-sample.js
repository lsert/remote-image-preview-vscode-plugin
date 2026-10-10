// 这是一个用于测试 remote-image-preview 插件的文件
// 请先配置 CDN 前缀（例如：https://avatars.githubusercontent.com 或 https://gw.alipayobjects.com）

// 1. 测试常见绝对路径
const avatar = "/u/9919"; // 如果 CDN 是 https://avatars.githubusercontent.com，可将此后缀拼为完整图片
const alipayIcon = "/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png";

// 2. 测试不同后缀
const logo = "/images/logo.png";
const banner = "/assets/banner.jpg";
const icon = "/icons/arrow.svg";
const animated = "/media/loading.gif";
const webpImage = "/static/photo.webp";

// 3. 测试不会被匹配的相对路径与别名（应被自动忽略）
const ignoredRelative = "./images/logo.png";
const ignoredParent = "../images/logo.png";
const ignoredAlias = "@/assets/logo.png";
const ignoredFullUrl = "https://cdn.example.com/logo.png";

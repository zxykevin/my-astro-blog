---
title: 从零搭建 VPS 节点
published: 2026-05-10
description: 记录一次使用 Vultr 日本 VPS、Ubuntu 22.04、Xray-core 与 VLESS Reality Vision 搭建个人代理节点的完整流程。
tags: [VPS, Linux, 自建服务, 网络配置, 技术折腾]
category: 技术笔记
pinned: true
draft: false
---

# 从零搭建 VPS 节点

这篇记录的是我实际搭建一套自用 VPS 节点的流程：从购买 Vultr 服务器，到安装 Xray-core，再到手机端用 ClashBox / v2rayNG 连通测试。文中所有 IP、UUID、公钥、端口等敏感信息都用占位符替代，照着做时请换成你自己服务器上生成的配置。

## 1. 购买 VPS

我用的是 Vultr，最后选择的配置是：

- 地区：Tokyo, Japan
- 系统：Ubuntu 22.04
- 类型：Shared CPU
- 配置：1 vCPU / 1GB RAM
- 价格：约 5 美元/月
- Backup：关闭

一开始差点选成 Dedicated CPU 和美国 Chicago，后来改成了 Shared CPU + Tokyo + 1GB + 关闭 Backup。对于轻量自用节点来说，这个选择更合适：成本低、离亚洲网络更近，也足够跑基础代理服务。

## 2. 登录服务器

Vultr 创建实例后，可以先用 Web Console 确认系统能正常启动。后续管理更推荐用本地 SSH。

在 Windows PowerShell 里执行：

```powershell
ssh root@<YOUR_SERVER_IP>
```

第一次连接会提示：

```text
Are you sure you want to continue connecting?
```

输入：

```text
yes
```

如果重装系统后再次连接，可能会遇到：

```text
REMOTE HOST IDENTIFICATION HAS CHANGED
```

这是因为本地保存的旧 SSH 指纹和新系统不一致。可以先删除旧记录：

```powershell
ssh-keygen -R <YOUR_SERVER_IP>
```

然后重新 SSH 登录。

## 3. 重装服务器

第一次配置如果比较乱，最省心的办法是直接重装系统。

在 Vultr 面板里选择：

```text
Reinstall OS -> Ubuntu 22.04
```

这一步会清空服务器并重新安装系统。对于刚开始搭建、还没有正式数据的 VPS 来说，重装比在混乱配置上继续修补更干净。

## 4. 安装代理服务端

我使用的是 `v2ray-agent` 一键脚本：

```bash
bash <(curl -Ls https://raw.githubusercontent.com/mack-a/v2ray-agent/master/install.sh)
```

这个脚本会自动安装和配置相关组件，包括：

- Xray-core
- VLESS
- Reality
- XTLS Vision

脚本进入菜单后，选择：

```text
3. 一键无域名 Reality
```

核心选择：

```text
1. Xray-core
```

后面大部分选项保持默认即可。最终生成的协议栈是：

```text
VLESS + Reality + TCP + XTLS Vision
```

这也是整套节点的核心。

## 5. 保存节点信息

安装完成后，脚本会生成一条 `vless://` 开头的完整链接。务必把它保存到安全的地方，不要公开发布。

节点信息大概长这样：

```text
协议：VLESS
地址：<YOUR_SERVER_IP>
端口：<REALITY_PORT>
传输：TCP
安全：Reality
Flow：xtls-rprx-vision
SNI：www.u-can.co.jp
Fingerprint：chrome
UUID：<YOUR_UUID>
Public Key：<YOUR_PUBLIC_KEY>
Short ID：<YOUR_SHORT_ID>
```

其中 `www.u-can.co.jp` 是 Reality 的伪装目标站，是一个真实可访问的日本教育 / 资格培训网站。真正使用时，以脚本生成的配置为准，不要手动乱改 UUID、公钥和 Short ID。

## 6. 手机端测试

安卓 / 鸿蒙手机上可以先用 v2rayNG 测试，也可以用 ClashBox。

如果使用 ClashBox，要选择：

```text
mihomo / Clash.Meta 内核
```

原因是普通 Clash 不支持：

```text
VLESS + Reality + Vision
```

如果把 `vless://` 链接转换成 Clash YAML，核心结构大概是：

```yaml
proxies:
  - name: JP-Reality
    type: vless
    server: <YOUR_SERVER_IP>
    port: <REALITY_PORT>
    uuid: <YOUR_UUID>
    network: tcp
    udp: true
    tls: true
    servername: www.u-can.co.jp
    flow: xtls-rprx-vision
    client-fingerprint: chrome
    reality-opts:
      public-key: <YOUR_PUBLIC_KEY>
      short-id: <YOUR_SHORT_ID>
```

规则部分要注意逗号格式。错误写法类似：

```yaml
rules:
  - DOMAIN ipinfo.io PROXY
```

这会报错：

```text
rules[0] [DOMAIN ipinfo.io PROXY] error: format invalid
```

正确写法是：

```yaml
rules:
  - DOMAIN,ipinfo.io,PROXY
  - MATCH,PROXY
```

导入后选择 `JP-Reality`，再打开浏览器或常用 App 测试访问情况。

## 7. 验证链路

连接成功后，整条链路是：

```text
手机
  ↓
ClashBox / v2rayNG / v2rayN
  ↓
VLESS + Reality + Vision
  ↓
Vultr Tokyo VPS
  ↓
外网
```

我最后在手机上成功连上 `JP-Reality`，Google、X、ChatGPT 都能正常使用。能从手机端通过这条代理发出消息，就说明客户端、节点、VPS 出口这三段链路都已经打通。

## 8. 用 Termux 管理服务器

后续也可以在 Android 手机上用 Termux 管理 VPS。

第一次使用时可能会发现没有 SSH：

```text
The program ssh is not installed
```

安装 OpenSSH：

```bash
pkg update
pkg install openssh
```

然后登录服务器：

```bash
ssh root@<YOUR_SERVER_IP>
```

进入服务器后，可以安装或打开 `htop` 查看资源占用：

```bash
htop
```

退出 `htop` 按：

```text
q
```

## 9. 进入 v2ray-agent 管理菜单

如果直接输入：

```bash
v2ray-agent
```

提示：

```text
command not found
```

可以再次运行原安装命令进入管理菜单：

```bash
bash <(curl -Ls https://raw.githubusercontent.com/mack-a/v2ray-agent/master/install.sh)
```

这个脚本既是安装器，也是管理入口。以后可以在菜单里做这些事：

- 查看当前配置
- 管理 Reality
- 添加或删除 UUID
- 管理用户
- 更新或维护 Xray-core

## 10. 最终架构

最终这套方案可以概括成一句话：

```text
Vultr 日本 VPS + Ubuntu 22.04 + Xray-core + VLESS Reality Vision + ClashBox/mihomo 客户端
```

它的优点是不用域名，配置流程相对直接，手机端和电脑端都能接入。真正需要注意的地方主要有三个：不要泄露节点链接，不要把真实 IP / UUID / 公钥发到公开页面，客户端一定要使用支持 Reality 和 Vision 的内核。

搭好之后，建议把完整节点信息保存在本地密码管理器里；公开写博客时只记录流程和排错经验，敏感字段统一替换成占位符。

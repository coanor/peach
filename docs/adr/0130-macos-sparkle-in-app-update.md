# ADR-0130：macOS 独立包用 Sparkle 2 做应用内更新

- 状态：提议（草案；未实施，签名私钥未生成）
- 日期：2026-11-01
- 关系：补充 [ADR-0012](0012-version-and-update-boundary.md) 的更新边界与 [ADR-0120](0120-standalone-update-client-compatibility.md) 的旧客户端兼容门槛；appcast 的发布位置依赖 [ADR-0127](0127-verified-release-artifact-promotion.md) 的晋级流程。前置改动是 macOS 独立包按本机架构检查 DMG（分支 `agent/claude/cross-platform-parity` 的 `0fd5cf9a0`，撰写时尚未合入）

## 背景

Windows 独立包由 `standalone_update` 在应用内下载、替换并重启。macOS 独立包是 PyInstaller 打的 `Peach.app`，ad-hoc 签名、未公证，按 arm64 与 x86_64 分别出 DMG。前置改动之后，macOS 只认本机架构的 `Peach-<版本>-macos-<架构>.dmg`，设置页给出下载键，由用户拖入「应用程序」替换，每次替换后还要按 `scripts/MACOS_DOWNLOADS.md` 再跑一次移除隔离标记的命令。

macOS 应用的成熟更新方案是 [Sparkle](https://sparkle-project.org/)：appcast 列出版本，EdDSA 签名校验下载内容，独立的 `Autoupdate` 在应用退出后替换并重开。本文评估把 Sparkle 2 接进现有 `Peach.app`，不照搬 Windows 的自写流程。

结论依据 Sparkle 2.10.1（2026-10-25 发布）的源码与官方发布包。发布包在 Windows 上离线解包并解析 Mach-O 头，没有在 macOS 上运行，未在真机验证的项列在「未取得的证据」。

## 可行性结论

可行，前提是接受下文三条约束：EdDSA 私钥是 ad-hoc 签名下唯一的信任锚，丢失或更换后已装客户端只能手动重装；第一个带 Sparkle 的版本仍需手动安装一次；macOS 13 起的「应用管理」保护对 ad-hoc 包的实际行为未取得，必须在真机验收后才能发布。

| 问题 | 结论 | 依据 |
| --- | --- | --- |
| ad-hoc 新包能否通过校验 | 能。旧包与新包的 ad-hoc 签名都算「已签名」；新包满足不了旧包的 designated requirement（ad-hoc 的要求是 cdhash，每版都不同），但 EdDSA 校验通过、且新包自身签名有效时接受 | `SUUpdateValidator.m` 第 334–373 行：`passedDSACheck \|\| passedCodeSigning`；`SUCodeSigningVerifier.m` 的 `bundleAtURLIsCodeSigned:` 以能否取得 designated requirement 判断是否签名，ad-hoc 包能取得隐含的 cdhash 要求 |
| 隔离标记 | Sparkle 在安装前对新包整树移除 `com.apple.quarantine`，失败只记日志不中止 | `SUPlainInstaller.m` 第 46–53 行 |
| Gatekeeper | 新包没有隔离标记，不触发首次打开的评估。新包无 Team ID 时 Sparkle 做原子交换，并在 macOS 14.4 起调用 `gktool scan` 预热，扫描失败不影响安装 | `SUPlainInstaller.m` 第 94–120、347–383 行。真机行为未取得 |
| 应用管理（macOS 13 起） | 未取得。Apple 只说明同一开发团队签名的应用可以互相更新，否则拦截并通知用户；ad-hoc 签名没有 Team ID，文档未说明这类包是否受保护 | WWDC22「What's new in privacy」 |
| 能否轮换 EdDSA 私钥 | 不能。Sparkle 的轮换兜底要求新包满足旧包的 designated requirement，ad-hoc 永远满足不了 | `SUUpdateValidator.m` 第 351 行起 |
| 以后改用 Developer ID | 兼容。Sparkle 只拒绝「已签名改为不签名」，ad-hoc 改为 Developer ID 时只要 EdDSA 私钥不变即可通过 | `SUUpdateValidator.m` 第 282 行 |
| 系统版本下限 | 不变。Sparkle 2.10.0 起要求 macOS 12.0（包内二进制 `minos` 为 12.0）；Peach 最近一次发布演练两个架构的 `minimum_macos` 已是 15.0 | Sparkle `CHANGELOG` 2.10.0 节；`release.yml` 运行 41107363667 的构建输出 |

## 决策（草案）

### 一、框架放在 `Contents/Frameworks`

1. 固定 Sparkle 官方发布包 `Sparkle-2.10.1.tar.xz`（SHA-256 `1a856d2a9edb8e628de88121d7be04cf0e2167f8641650b78fca00b14244cf27`），按 `scripts/fetch_cloudflared_macos.py` 的方式用清单固定版本与摘要，许可证随包放进 `Contents/Resources`。框架 3.0 MB，二进制均为 x86_64 + arm64 双架构。
2. `scripts/build_macos_standalone.py` 在 PyInstaller 生成 `Peach.app` 之后、`codesign` 之前，把 `Sparkle.framework` 按保留符号链接的方式复制到 `Peach.app/Contents/Frameworks/`。PyInstaller 的 `sys._MEIPASS` 就是这个目录，现有 `amane-runtime` 落在 `Contents/Frameworks/tools/amane-runtime` 可以印证。
3. 删除框架里的 `XPCServices/`。这两个服务只供沙盒应用使用，官方文档说明非沙盒应用可以移除。
4. Sparkle 自带的二进制带有 Sparkle 项目的 Developer ID 签名。按由内向外的顺序用 ad-hoc 重签 `Autoupdate`、`Updater.app` 与框架，再签 `Peach.app`，使整个包只有一种签名身份；现有的 `codesign --verify --deep --strict` 继续把关。不开 Hardened Runtime：开启后库验证会拒绝加载 ad-hoc 签名的框架（官方文档的 Library Validation 说明）。

### 二、菜单栏进程持有更新器

`peach serve` 是子进程，Sparkle 必须跑在菜单栏进程的主线程运行循环里。`tray.run_macos_menu_bar` 只在独立包且框架存在时加载：

```python
objc.loadBundle("Sparkle", namespace, bundle_path=str(Path(sys._MEIPASS) / "Sparkle.framework"))
controller = SPUStandardUpdaterController.alloc() \
    .initWithStartingUpdater_updaterDelegate_userDriverDelegate_(True, updater_delegate, driver_delegate)
```

菜单项「检查更新…」调用 `controller.checkForUpdates_(None)`，替换前置分支里复用版本检查加系统通知的那一项。委托是 `NSObject` 子类，承担 Windows `request_restart` 的同等职责：

| 委托方法 | 职责 |
| --- | --- |
| `updater:shouldProceedWithUpdate:updateCheck:error:` | 本机是 ledger 读取端且新版本带有本机账本未应用的迁移时拒绝，提示先在写入端迁移并同步（对应 `standalone_update._update_writer`） |
| `updater:shouldPostponeRelaunchForUpdate:untilInvokingBlock:` | 先按 `update_tasks.reserve` 保存任务进度，再 `manager.stop_owned()` 释放 80/443 等端口，然后调用传入的 block 继续安装 |
| `updaterWillRelaunchApplication:` | 兜底再停一次自有服务 |
| `supportsGentleScheduledUpdateReminders` 及配套方法 | 返回 YES。附件应用不实现时 Sparkle 会记日志警告，定时检查到的更新也不会抢焦点；提醒走现有 `MenuBarApp.notify` |

新版本的迁移信息写进 appcast 条目的自定义元素（例如 `peach:migrationHead`），委托经 `SUAppcastItem.propertiesDictionary` 读取。Sparkle 解析条目时，非 Sparkle 命名空间的子元素以限定名为键、文本为值存入这个字典（`SUAppcast.m` 第 60–71、205–211 行）。Sparkle 只在 `Autoupdate` 里解包，宿主拿不到解包目录，所以不能像 Windows 那样直接读暂存目录。

Sparkle 由 `Autoupdate` 经 LaunchServices 重开应用，不带 LaunchAgent 的 `--data-root` 参数和环境变量。重开后的进程必须靠数据目录记录（`settings_file.DATA_ROOT_LOCATION`）找到同一个数据根；也不归 launchd 管理，直到下次登录。更新触发的退出必须以 0 退出，避免与「异常退出后由 launchd 拉起」的设置在安装期间抢着启动旧包。

### 三、`Info.plist` 增加的键

在 `scripts/peach_macos.spec` 的 `info_plist` 中按构建架构写入：

| 键 | 值 | 说明 |
| --- | --- | --- |
| `SUFeedURL` | `https://downloads.peach.video/sparkle/macos-<架构>.xml` | 按 `PEACH_MACOS_TARGET_ARCH` 写死，每个架构一份 appcast。地址一旦发出就要长期可用 |
| `SUPublicEDKey` | 公钥 base64 | 仓库里只有一处常量，由测试锁定；更改需要新的 ADR |
| `SUVerifyUpdateBeforeExtraction` | YES | 2.7.3 起，解包前先验 EdDSA 签名 |
| `SUEnableAutomaticChecks` | 显式写值 | 不写时 Sparkle 会在第二次启动时弹窗询问；实际开关由设置页映射到 `SPUUpdater.automaticallyChecksForUpdates` |
| `SUAllowsAutomaticUpdates` | YES | 设置页的「自动下载」映射到 `automaticallyDownloadsUpdates`，下载后在退出时安装 |

不设置 `SUEnableInstallerLauncherService`、`SUEnableDownloaderService` 等 XPC 开关。`SURequireSignedFeed`（2.9 起）第一版不开：appcast 走 HTTPS，被篡改也只能指向仍须通过 EdDSA 校验的包，且安装器拒绝降级（`SUPlainInstaller.m` 第 325 行起）。之后需要签名 feed 时，新版本加上这个键即可，旧客户端不受影响。

`CFBundleVersion` 已等于三段式版本号，Sparkle 的标准比较器可以直接比较。

### 四、appcast 的生成与位置

1. **生成。** 标签流水线新增一个仅在标签上运行的 macOS 作业：取得已晋级的两个 DMG 与当前线上 appcast，用官方 `generate_appcast --ed-key-file -` 从标准输入读私钥，追加本版本条目。工具会挂载 DMG 读取包内 `Info.plist`，自动写出 `sparkle:version`、`sparkle:minimumSystemVersion`、`length` 与 `sparkle:edSignature`。用 `--maximum-versions` 只保留最近几版，不生成增量包。`peach:migrationHead` 由发布脚本在生成后补进本版本条目。公开仓库的 GitHub 托管 macOS runner 不计费。
2. **架构分开。** 每个架构一份 appcast，地址按构建架构写进 `Info.plist`。在 Apple 芯片上经 Rosetta 运行 x86_64 包时，继续拿到 x86_64 的更新，与 `release_updates.check` 用 `platform.machine()` 选 DMG 的行为一致。不用 2.9 起的 `sparkle:hardwareRequirements`：它只能声明「需要 arm64」，表达不了「只给 x86_64」。
3. **复用 DMG。** 更新包就是现有 DMG，不新增制品，R2 发布桶的 8 GB 预算不变。DMG 的 SHA-256 与 `SHA256SUMS.txt` 不受影响，EdDSA 签名只写在 appcast 里。
4. **托管。** feed 地址放在自有域名 `downloads.peach.video`，以后换存储后端不必改已装客户端。appcast 按 `releases.json` 的方式设一分钟缓存，在 DMG 公开并校验之后才上传。enclosure 指向同一 R2 源的 DMG：Sparkle 每个条目只有一个下载地址，没有备用源。
5. **R2 现状。** 撰写时 `downloads.peach.video/releases.json` 最新为 v0.50.0，GitHub Release 已到 v0.52.0。GitHub 的 `release.yml` 没有上传 R2 的步骤，`release_r2.py` 只由 GitLab 的 `publish-release` 调用。接入 Sparkle 前须先恢复 GitHub 发版流程的 R2 上传，否则 feed 托管须改为 GitHub 上固定标签的 Release 附件，地址要长期绑定这个仓库路径。

### 五、EdDSA 私钥的保管与注入

1. 用户在自己的 Mac 上运行 `generate_keys --account peach`，私钥存入登录钥匙串，输出的公钥写进仓库常量。
2. `generate_keys --account peach -x <文件>` 导出私钥（内容是 32 字节 seed 的 base64），存入 GitHub 仓库 `release` environment 的 secret，并限定只有 `v*` 标签能部署到该 environment；另在用户的密码管理器里离线备份一份，然后删除导出文件。
3. 只有第四节的标签作业引用这个 secret，通过 `echo "$SPARKLE_ED_PRIVATE_KEY" | generate_appcast --ed-key-file - …` 传入，不落盘、不进日志。版本提交的演练和 GitGud 流水线都不持有私钥。
4. 私钥丢失意味着所有已装的 Sparkle 客户端都要手动重装 DMG，因此备份是硬要求，不是建议。

### 六、与现有逻辑的衔接

| 位置 | 改动 |
| --- | --- |
| `distribution` | 新增 `update_installer()`，返回 `"windows-package"`、`"sparkle"` 或 `None`。`in_app_update()` 继续只管 Windows 的 `standalone_update`，不复用为 Sparkle 开关 |
| `release_updates.check` | 保留 macOS 按架构选 DMG 的逻辑，供设置页显示版本，也供尚未接入 Sparkle 的旧客户端使用；结果增加 `installer` 字段 |
| 设置页「检查更新」 | 有 Sparkle 时下载键改为「安装更新」，请求经现有状态文件通道交给菜单栏进程（复用 `standalone_update.poll(tray)` 的轮询方式），由它调用 `checkForUpdates:` 弹出 Sparkle 窗口 |
| `automatic_updates` | macOS 不再自己发通知或下载，只刷新设置页状态；定时检查与提醒交给 Sparkle，避免两套调度重复提示 |
| 菜单栏「检查更新」 | 改为 Sparkle 的 `checkForUpdates:` |
| `scripts/MACOS_DOWNLOADS.md`、`docs/OPERATIONS.md` | 移除隔离标记的命令只在首次安装时需要；之后经 Sparkle 更新不再需要 |
| `docs/REUSE.md` | 登记 Sparkle 的版本、许可与选用理由 |

### 七、旧客户端兼容门槛

参照 ADR-0120，这里有两类已装客户端：

1. **接入前的客户端**只读 `releases.json` 与 GitHub API 里的 `Peach-<版本>-macos-<架构>.dmg`，给出下载键。DMG 文件名和 `releases.json` 字段保持不变；第一个带 Sparkle 的版本由用户手动安装一次。
2. **接入后的客户端**把 feed 地址和公钥写死在包里。标签作业在上传 appcast 之前对每个架构核对：appcast 能解析；本版本条目的 `sparkle:edSignature` 用仓库公钥验得过实际 DMG；`sparkle:version` 高于 appcast 里所有旧条目；`minimumSystemVersion` 等于本次构建报告的 `minimum_macos`；enclosure 地址可公开下载且大小一致。任何一项不过就不上传。门槛同时由单元测试用合成的 DMG 与临时密钥对跑一遍，并在 macOS 验收作业里用临时私钥文件跑一次官方 `sign_update --verify`，确认签名格式与 Sparkle 一致。
3. 需要放弃一批 Sparkle 客户端时，用 appcast 的 `sparkle:minimumAutoupdateVersion` 或 `sparkle:minimumUpdateVersion` 显式声明，并在变更日志写明手动升级方法，与 `OLDEST_CLIENT` 的作用相同。

## 需要用户授权或决定的步骤

1. 生成 EdDSA 密钥对、导出私钥、写入 GitHub `release` environment secret、离线备份并删除导出文件（第五节）。凭据与私钥操作须在同一轮取得明确授权。
2. 在 GitHub 仓库设置中把 `release` environment 限定为 `v*` 标签部署。
3. 决定 feed 托管：恢复 GitHub 发版流程的 R2 上传（推荐），或改用 GitHub 固定标签的 Release 附件。前者还需要把 R2 凭据配进 GitHub 的 `release` environment。
4. 认可「私钥无法轮换、丢失即全体手动重装」这一后果。
5. 在一台或多台真机上完成下节的验收后，才把 Sparkle 版本标为可发布。

## 未取得的证据

以下各项只有源码阅读或文档依据，须在真机验收：

- **应用管理保护。** ad-hoc 签名、没有 Team ID 的 `Autoupdate` 替换同为 ad-hoc 的 `Peach.app` 时，macOS 13、14、15、26 是否拦截或弹出「想要管理其他应用」的通知：未取得。如果拦截，用户须在「系统设置 > 隐私与安全性 > 应用管理」放行一次，并确认放行能否跨版本保留。
- **Gatekeeper 与 `gktool scan`。** 未隔离的 ad-hoc 包在 macOS 15 与 26 上替换后能否直接启动，`gktool scan` 对 ad-hoc 包的返回值：未取得。
- **pyobjc 调用委托。** `objc.loadBundle` 加载框架后，带 block 参数的委托方法（`untilInvokingBlock:`、`immediateInstallationBlock:`）需要用 `objc.registerMetaDataForSelector` 声明 block 签名才能从 Python 调用，`supportsGentleScheduledUpdateReminders` 要按只读属性实现：均未取得。
- **`generate_appcast` 保留自定义元素。** 再次运行时旧条目里补写的 `peach:migrationHead` 是否原样保留：未取得。
- **重开后的数据根。** 经 LaunchServices 重开、不带 `--data-root` 时，独立包能否找到 LaunchAgent 指定的同一数据根：未取得。
- **安装位置权限。** 应用不在当前用户可写的位置（例如由另一个管理员拖入「应用程序」）时 Sparkle 的授权流程：未取得。
- **与 launchd 自动拉起的配合。** 菜单栏「异常退出后由 launchd 拉起」的改动尚在进行，`KeepAlive` 的最终形态未取得；本方案要求更新时的正常退出不会触发拉起。

## 已拒绝方案

- **照搬 Windows：自写 DMG 下载、挂载、替换与重启。** 与「各平台采用最成熟方案」的前提相悖。Sparkle 已经处理了替换时机、原子交换、隔离标记、降级保护和签名校验，自写只会重复这些边界。
- **先做 Developer ID 签名与公证，再接 Sparkle。** 能消除应用管理与隔离标记两项未知，但需要付费开发者账号与公证流程。它与 Sparkle 不互斥：只要 EdDSA 私钥不变，以后从 ad-hoc 改为 Developer ID 不影响已装客户端，所以不作为前置条件。
- **在 ubuntu 上用 Python 计算 EdDSA 签名、自己拼 appcast。** 能沿用现有的 Linux 发布作业，但要重新实现官方工具已有的读取包信息、签名与签名 feed 格式。官方 `generate_appcast` 只需要一个仅在标签上运行的 macOS 作业，因此选用官方工具，Python 只做发布前的校验。
- **两个架构合并成一份 appcast，用 `sparkle:hardwareRequirements` 区分。** 该元素只能要求 arm64，表达不了「只给 x86_64」；分开两份更直接，也与按架构命名的 DMG 一致。
- **另出 ZIP 作为更新包。** Sparkle 支持 DMG，复用现有 DMG 不增加制品与发布桶占用。增量包需要在 macOS 上用 `BinaryDelta` 生成，体积收益留待以后评估。

## 后果

- 接入后，macOS 用户在菜单栏或设置页即可完成更新，只在首次安装时执行一次移除隔离标记的命令。
- 发布流程新增一个仅在标签上运行的 macOS 作业和一份长期有效的 feed 地址；R2 发布须先恢复。
- EdDSA 私钥成为不可替换的资产。仓库公钥由测试锁定，更换要新的 ADR，并接受已装客户端全部手动重装。
- 应用管理保护的真机结果可能改变上线方式：若 macOS 拦截 ad-hoc 包的自更新，要么在文档中说明放行步骤，要么先完成 Developer ID 签名再上线 Sparkle。

# 模拟应用 (Mock Apps)

本项目包含多种模拟应用，用于给 Agent 测试在系统和三方应用中的交互能力。

## 备忘录（Memo）模拟应用

位置：`src/mockapps/memo/MemoApp.ts`

能力：
- 读取备忘录（按名称）
- 写入备忘录（可选名称；无名称则新建）
- 追加写入备忘录（按名称）
- 删除备忘录（按名称）
- 检索备忘录（列出所有 `.txt` 文件名）

存储位置：
- 默认写入到 `agent.workDir` 下的 `mockapps/memo/` 目录（例如 `.agent-work/mockapps/memo`）

对应工具：
- `memo_read`
- `memo_write`
- `memo_append`
- `memo_delete`
- `memo_list`

---

## 相册（Photo）模拟应用

位置：`src/mockapps/photo/PhotoApp.ts`

能力：
- 保存照片（从给定的 URL 或本地文件路径复制内容，可指定文件名，默认时间戳生成）
- 读取所有照片列表
- 删除指定照片

存储位置：
- 默认写入到 `agent.workDir` 下的 `mockapps/Photo/` 目录

对应工具：
- `photo_save` (参数已从内容字符串更改为 `sourceUrlOrPath`)
- `photo_retrieve`
- `photo_delete`

---

## 联系人（Contact）模拟应用

位置：`src/mockapps/contact/ContactApp.ts`

能力：
- 添加联系人或更新现有同名联系人
- 按照名称、昵称或手机号码模糊检索联系人
- 删除指定联系人

实体属性：
- `name`, `nicknames`, `phoneNumbers`, `address`, `gender`, `email`, `notes`

存储位置：
- 将所有联系人以JSON数组的方式统一持久化到 `agent.workDir` 下的 `mockapps/Contact/contacts.json` 中

对应工具：
- `contact_add`
- `contact_search`
- `contact_delete`

---

## 短信（SMS）模拟应用

位置：`src/mockapps/sms/SmsApp.ts`

能力：
- 发送短信（需要提供联系电话及内容）
- 读取短信记录（支持通过电话、消息上限数、及时间戳范围过滤）
- 删除短信记录（依电话号码全盘删除）

实体属性：
- `id`, `phoneNumber`, `content`, `timestamp`

存储位置：
- 持久化到 `agent.workDir` 下的 `mockapps/SMS/sms.json` 中，按电话号区分结构

对应工具：
- `sms_send`
- `sms_read`
- `sms_delete`

---

## 邮件（Email）模拟应用

位置：`src/mockapps/email/EmailApp.ts`

能力：
- 发送邮件（`to`, `subject`, `content`必填，`cc`, `attachFile`可选）
- 读取邮件（支持 `limit` 数量上限，支持 `unreadOnly` 仅看未读，支持按 `sender` 过滤。无过滤参数默认返回最新 30 封）
- 根据唯一ID删除邮件

实体属性：
- `id`, `from`, `to`, `cc`, `subject`, `content`, `attachFile`, `isRead`, `timestamp`

存储位置：
- 持久化到 `agent.workDir` 下的 `mockapps/Email/emails.json`

对应工具：
- `email_send`
- `email_read`
- `email_delete`

---

## 日程（Calendar）模拟应用

位置：`src/mockapps/calendar/CalendarApp.ts`

能力：
- 添加日程（`title`，`startTime`必填，`endTime`默认1小时后，可支持 `location`，`attendance`，`notes`）
- 读取日程（支持 `startTime` 与 `endTime` 区间过滤）
- 根据唯一ID删除日程

实体属性：
- `id`, `title`, `startTime`, `endTime`, `location`, `attendance`, `notes`

存储位置：
- 持久化到 `agent.workDir` 下的 `mockapps/Calendar/events.json`

对应工具：
- `calendar_add`
- `calendar_read`
- `calendar_delete`

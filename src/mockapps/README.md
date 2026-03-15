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

# Two of Us

一个记录情侣点滴的私密网页项目原型。

## 已实现

- 在一起时间计数器
- 关系仪表盘
- 回忆时间线，可新增记录
- 未来愿望清单，可推进状态
- 纪念日倒计时
- 支持上传的照片墙
- 悄悄话和定时解锁
- Supabase 云端同步，本地 `localStorage` 兜底

## 使用方式

直接在浏览器打开 `index.html` 即可。部署后推荐通过 GitHub Pages 访问。

如果要修改在一起的开始时间，编辑 `app.js` 顶部的：

```js
const COUPLE_START_DATE = "2026-06-08T14:59:00+08:00";
```

## Supabase

在 Supabase SQL Editor 执行 `supabase-setup.sql`，然后页面会自动使用云端同步。

当前前端使用的是 publishable key。不要把 `service_role` key 放进前端代码。

## 后续可扩展

- 登录和访问密码
- 图片上传
- 云端同步
- 纪念日提醒
- 数据导出和备份
- 手机桌面快捷入口

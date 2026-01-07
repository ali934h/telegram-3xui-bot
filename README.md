# 🤖 3x-ui Telegram Bot

مدیریت پنل 3x-ui مستقیما از تلگرام با استفاده از Cloudflare Workers.

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot-26A5E4?logo=telegram&logoColor=white)](https://core.telegram.org/bots)

## 📑 فهرست مطالب

- [ویژگی‌ها](#-ویژگیها)
- [نصب اولیه](#-نصب-اولیه)
- [استفاده](#-استفاده)
- [عیب‌یابی](#-عیبیابی)

---

## ✨ ویژگی‌ها

- ➕ افزودن کلاینت به inbound
- 🔐 احراز هویت امن با پنل 3x-ui
- ⚙️ امکان تغییر تنظیمات پنل
- ⚡ ذخیره session برای عملکرد سریع

---

## 🚀 نصب اولیه

### پیش‌نیازها

- [حساب Cloudflare](https://dash.cloudflare.com/sign-up) (رایگان)
- پنل 3x-ui نصب شده
- [Node.js](https://nodejs.org/) نسخه 18+

### 1. ساخت ربات تلگرام

1. به [@BotFather](https://t.me/BotFather) پیام دهید
2. دستور `/newbot` را ارسال کنید و مراحل را دنبال کنید
3. **توکن ربات** را ذخیره کنید (مثال: `1234567890:ABC...`)
4. User ID خود را از [@userinfobot](https://t.me/userinfobot) دریافت کنید

### 2. کلون و نصب

```bash
git clone https://github.com/ali934h/telegram-3xui-bot.git
cd telegram-3xui-bot
npm install
```

### 3. ساخت KV Namespace

```bash
npx wrangler login
npx wrangler kv namespace create "PANEL_DATA"
```

ID دریافتی را کپی کرده و در `wrangler.jsonc` قرار دهید:

```json
"kv_namespaces": [{
    "binding": "PANEL_DATA",
    "id": "abc123..."  // ← ID منحصر به فرد شما
}]
```

⚠️ **مهم:** این ID منحصر به فرد حساب Cloudflare شماست.

### 4. تنظیم Secrets

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
# توکن ربات را paste کنید

npx wrangler secret put ALLOWED_USER_IDS
# User ID ها را وارد کنید (مثال: 123456789 یا 123,456,789)
```

### 5. Deploy

```bash
npx wrangler deploy
```

### 6. فعال‌سازی ربات

در مرورگر باز کنید:
```
https://YOUR-WORKER-NAME.workers.dev/registerWebhook
```

پاسخ مورد انتظار:
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

### 7. شروع استفاده

1. ربات را در تلگرام باز کنید → `/start`
2. آدرس پنل خود را وارد کنید (مثال: `https://panel.example.com`)
3. نام کاربری پنل را وارد کنید
4. رمز عبور را وارد کنید
5. منوی اصلی نمایش داده می‌شود

---

## 📝 استفاده

### دستورات

| دستور | توضیحات |
|--------|----------|
| `/start` | نمایش منوی اصلی |
| `/setup` | تنظیم مجدد پنل |

### افزودن کلاینت

1. از منوی اصلی "➕ افزودن کلاینت" را انتخاب کنید
2. Inbound مورد نظر را انتخاب کنید
3. ایمیل کلاینت را وارد کنید
4. تایید کنید

---

## 🐛 عیب‌یابی

### ربات پاسخ نمیدهد

```bash
# بررسی secrets
npx wrangler secret list

# بررسی webhook
curl https://YOUR-WORKER.workers.dev/registerWebhook

# مشاهده لاگ‌ها
npx wrangler tail
```

### Webhook خطای 404 می‌دهد

Secrets موجود نیست:

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put ALLOWED_USER_IDS
npx wrangler deploy
```

---

## 🛠️ پیکربندی

### Secrets (در Cloudflare)

| Secret | منبع | مثال |
|--------|------|------|
| `TELEGRAM_BOT_TOKEN` | @BotFather | `1234567890:ABC...` |
| `ALLOWED_USER_IDS` | @userinfobot | `123456789` |

**نکته:** Secrets در Cloudflare ذخیره می‌شوند، نه در Git. بعد از هر clone جدید باید دوباره تنظیم شوند.

### wrangler.jsonc

- `name` - نام Worker (URL را مشخص می‌کند)
- `kv_namespaces.id` - ID منحصر به فرد KV namespace شما

---

## 📊 معماری

```
Telegram → Webhook → Cloudflare Worker → 3x-ui Panel API
                           ↓
                      KV Storage
                 (panel config, session, state)
```

---

## 📜 لایسنس

MIT License

## 🙏 قدردانی

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [3x-ui Panel](https://github.com/MHSanaei/3x-ui)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

**ساخته شده با ❤️ توسط [Ali Hosseini](https://github.com/ali934h)**

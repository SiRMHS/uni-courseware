# تم و چیدمان

## حالت روشن/تاریک (Theme)

### ThemeProvider
فایل: `lib/theme-context.jsx`

- `theme`: `'dark'` یا `'light'`
- `toggleTheme()`: تغییر وضعیت
- `setTheme(theme)`: تنظیم مستقیم

تم پیش‌فرض `dark` است. وضعیت در `localStorage` با کلید `theme` ذخیره می‌شود.

### ThemeToggle
فایل: `components/ThemeToggle.jsx`

دکمه‌ای در هدر و سایدبار که آیکون Sun/Moon را نشان می‌دهد.

## سایدبار (Sidebar)

### ویژگی‌ها
- ارتفاع ثابت full viewport (`h-screen`)
- **قابلیت جمع‌شدگی**: دکمه toggle در بالای سایدبار
  - حالت باز: `w-80` با نمایش متن و آیکون
  - حالت بسته: `w-16` فقط آیکون‌ها
  - وضعیت در `localStorage` با کلید `sidebarCollapsed` ذخیره می‌شود
- بخش کاربر در **پایین سایدبار** به صورت sticky (خارج از ScrollArea)
- فقط بخش محتوا اسکرول می‌خورد

### Collapse Toggle
دکمه با آیکون `PanelLeftClose` / `PanelLeftOpen` در بالای سایدبار کنار دکمه تم.

## چیدمان صفحه

```
┌─────────────────────────────────────────────┐
│  Sidebar (fixed)  │  Header (sticky)        │
│  ┌──────────────┐ │  ┌────────────────────┐ │
│  │ Menu items   │ │  │ Dynamic user info  │ │
│  │ (scrollable) │ │  └────────────────────┘ │
│  │              │ │  Content (scrollable)   │
│  │              │ │  ┌────────────────────┐ │
│  │              │ │  │                    │ │
│  ├──────────────┤ │  │                    │ │
│  │ User card    │ │  │                    │ │
│  │ (sticky)     │ │  │                    │ │
│  └──────────────┘ │  └────────────────────┘ │
└─────────────────────────────────────────────┘
```

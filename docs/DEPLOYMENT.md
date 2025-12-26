# Deployment Guide: Where Did The Money Go?

This guide covers everything you need to deploy your application to a live server.

## Table of Contents

1. [Files to Upload](#1-files-to-upload)
2. [File/Folder Permissions](#2-filefolder-permissions)
3. [Preventing Website Copying](#3-preventing-website-copying)
4. [Live Server Verification Checklist](#4-live-server-verification-checklist)
5. [Analytics Setup](#5-analytics-setup)
6. [Server Configuration](#6-server-configuration)
7. [Quick Deploy Commands](#7-quick-deploy-commands)

---

## 1. Files to Upload

Upload **only the `dist/` folder contents** to your web server. Here's the structure:

```
dist/
├── index.html              (1.7 KB - entry point)
├── assets/
│   ├── index-*.js          (~673 KB - main bundle, minified)
│   ├── index-*.css         (~82 KB - styles)
│   ├── VirtualizedTransactionList-*.js (~25 KB - code-split chunk)
│   └── csv-parser.worker-*.js (~3.4 KB - web worker)
├── demo-data.csv           (8.5 KB)
├── favicon.svg             (0.8 KB)
├── logo_1.png through logo_5.png
└── vite.svg
```

**Total size: ~932 KB** (gzipped transfer: ~185 KB)

### Do NOT Upload

| Folder/File | Reason |
|-------------|--------|
| `node_modules/` | Development dependencies only |
| `src/` | Source code (already compiled into dist/assets) |
| `.git/` | Version control history |
| `docs/` | Internal documentation |
| `sample-data/` | Test data with personal info |
| `e2e/` | End-to-end test files |
| `scripts/` | Development scripts |
| `.storybook/` | Storybook configuration |
| `package.json` | Node.js configuration |
| `vite.config.ts` | Build configuration |
| `tsconfig*.json` | TypeScript configuration |
| `eslint.config.js` | Linting configuration |
| `*.config.ts/js` | All config files |

---

## 2. File/Folder Permissions

Before or after uploading, set these permissions:

```bash
# Directories: 755 (rwxr-xr-x)
find /path/to/your/site -type d -exec chmod 755 {} \;

# Files: 644 (rw-r--r--)
find /path/to/your/site -type f -exec chmod 644 {} \;
```

### Permission Breakdown

| Type | Permission | Meaning |
|------|------------|---------|
| Directories | `755` | Owner can read/write/execute; others can read/execute |
| Files | `644` | Owner can read/write; others can read only |
| index.html | `644` | Readable by web server |
| .js/.css files | `644` | Readable by web server |

Most FTP clients (FileZilla, Cyberduck) upload with correct permissions by default.

### Common Permission Issues

- **403 Forbidden**: Usually means directory permissions are wrong (should be 755)
- **500 Internal Server Error**: Check file permissions and .htaccess syntax
- **Blank page**: Check browser console for JavaScript loading errors

---

## 3. Preventing Website Copying

### Reality Check

Since this is a client-side React app, the code is inherently visible to browsers. However, you can make it harder to copy.

### Already in Place

- Code is **minified** (variable names shortened, whitespace removed)
- Code is **bundled** (113 modules combined into single files)
- No source maps uploaded (debugging info stays local)

### Additional Measures

#### Legal Protection

Add a copyright notice to your footer:

```
© 2025 Your Name. All rights reserved.
```

#### Server-Side Protection (Apache .htaccess)

```apache
# Block common scraping tools
RewriteEngine On
RewriteCond %{HTTP_USER_AGENT} (HTTrack|wget|curl|grab|spider|bot) [NC]
RewriteRule .* - [F,L]

# Disable directory listing
Options -Indexes

# Prevent hotlinking of assets
RewriteCond %{HTTP_REFERER} !^$
RewriteCond %{HTTP_REFERER} !^https?://(www\.)?yourdomain\.com [NC]
RewriteRule \.(js|css|png|jpg|svg)$ - [F,L]
```

#### Server-Side Protection (Nginx)

```nginx
# Block scraping tools
if ($http_user_agent ~* (HTTrack|wget|curl|grab|spider)) {
    return 403;
}

# Disable directory listing
autoindex off;
```

#### Rate Limiting

Configure at server/CDN level to prevent bulk downloads.

### Honest Assessment

Complete copy protection is impossible for client-side apps. Your best protection is:

1. Minification (already done)
2. No source maps in production
3. Legal copyright notice
4. Focus on building features faster than copycats
5. Your unique data mappings and category logic

---

## 4. Live Server Verification Checklist

After deploying, verify these items:

### Critical Functionality

- [ ] Page loads without errors (check browser console)
- [ ] CSS styles load correctly (fonts, colors, layout)
- [ ] CSV file upload works (drag & drop or file picker)
- [ ] Demo data loads via "Load Demo Data" button
- [ ] Transactions display correctly in list and charts
- [ ] Category filtering works
- [ ] Settings panel opens and saves preferences
- [ ] Dark mode toggle works
- [ ] Data persists after page refresh (localStorage)
- [ ] Export functionality (CSV, JSON) works
- [ ] Keyboard shortcuts work (Ctrl+F, Ctrl+S, Ctrl+E)

### Browser Testing

- [ ] Chrome/Edge (primary)
- [ ] Firefox
- [ ] Safari (important for Mac/iOS users)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Performance Checks

- [ ] First load under 3 seconds on decent connection
- [ ] No CORS errors in console
- [ ] Fonts load correctly (DM Sans, IBM Plex Mono)
- [ ] Images load (logos, favicon)

### Quick Test Script

1. Open site in incognito/private mode
2. Click "Load Demo Data"
3. Switch between tabs (Overview, Transactions, Subscriptions)
4. Open Settings, enable dark mode, refresh page
5. Upload a CSV file if you have one
6. Try exporting data (CSV and JSON)
7. Test on mobile device

---

## 5. Analytics Setup

### Umami Analytics (Privacy-Friendly, Recommended)

Umami is a privacy-focused, GDPR-compliant alternative to Google Analytics. It's more aligned with your "privacy-first" messaging.

#### Setup Steps

1. **Self-host** Umami or use [Umami Cloud](https://umami.is/pricing)
2. Create a website in Umami dashboard
3. Copy your website ID
4. Edit `index.html` before building (or edit `dist/index.html` after building):

```html
<!-- Uncomment and update -->
<script defer src="https://your-umami-instance.com/script.js"
        data-website-id="abc123-your-website-id"></script>
```

#### Why Umami?

- No cookies required
- GDPR/CCPA compliant by default
- Lightweight (~1KB script)
- Self-hostable for complete control
- Matches your privacy-first brand

### Google Analytics 4

#### Setup Steps

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a new property (Web)
3. Get your Measurement ID (starts with `G-`)
4. Edit `index.html`:

```html
<!-- Uncomment and update GA_MEASUREMENT_ID in both places -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Using Both Analytics

You can use both Umami and Google Analytics simultaneously if needed. Just uncomment both script blocks.

---

## 6. Server Configuration

### SPA Routing (for future React Router)

If you add client-side routing later, configure your server to serve `index.html` for all routes:

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

#### Nginx

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Enable Gzip Compression

Reduces transfer size significantly (673 KB → 163 KB for main JS bundle).

#### Apache

```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>
```

#### Nginx

```nginx
gzip on;
gzip_types text/html text/css application/javascript application/json;
gzip_min_length 1000;
```

### Cache Headers

Set appropriate cache headers for static assets:

#### Apache

```apache
<IfModule mod_expires.c>
  ExpiresActive On

  # HTML - no cache (always fresh)
  ExpiresByType text/html "access plus 0 seconds"

  # CSS and JS - cache for 1 year (they have hash in filename)
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"

  # Images - cache for 1 month
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>
```

---

## 7. Quick Deploy Commands

### Build Fresh Production Bundle

```bash
npm run build
```

### Verify Build Output

```bash
ls -la dist/
du -sh dist/
```

### Upload via rsync (SSH Access)

```bash
rsync -avz --delete dist/ user@yourserver.com:/var/www/yoursite/
```

### Upload via FTP (Create ZIP First)

```bash
cd dist && zip -r ../site.zip . && cd ..
# Then upload site.zip via FTP and extract on server
```

### Preview Locally Before Deploying

```bash
npm run preview
# Opens at http://localhost:4173
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Blank page | Check browser console for JS errors, verify all files uploaded |
| Fonts not loading | Check CORS headers, verify Google Fonts is accessible |
| Charts not showing | Check console for errors, may need browser refresh |
| localStorage not working | Check if site is served over HTTPS (required on some browsers) |
| Dark mode not persisting | Clear localStorage and try again |

### Debug Mode

Enable debug mode in Settings → Developer Tools to:
- View localStorage usage
- Inspect transaction data
- Monitor performance metrics
- Test error boundaries

---

*Last updated: 2025-12-26*

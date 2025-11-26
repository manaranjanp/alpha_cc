# Deployment Guide

This guide explains how to deploy and run the Stock Alpha & Beta Analyzer application.

## Quick Start with Python HTTP Server

The easiest way to run the application is using Python's built-in HTTP server:

### Step 1: Build the Application

```bash
npm install
npm run build
```

This will create a single HTML file in the `dist` directory.

### Step 2: Serve with Python HTTP Server

Navigate to the dist directory and start a Python HTTP server:

```bash
cd dist
python3 -m http.server 8000
```

or for Python 2:

```bash
cd dist
python -m SimpleHTTPServer 8000
```

### Step 3: Access the Application

Open your browser and navigate to:
```
http://localhost:8000
```

## Alternative Deployment Methods

### Method 1: Direct File Access

The built application is a single HTML file that can be opened directly:

1. Build the application: `npm run build`
2. Open `dist/index.html` in your browser

### Method 2: Nginx

Configure Nginx to serve the dist folder:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/alpha-beta-analyzer/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

### Method 3: Apache

Configure Apache with a `.htaccess` file:

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

### Method 4: Static Hosting Services

The application can be hosted on any static hosting service:

- **GitHub Pages**: Push the `dist` folder contents
- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Deploy with `vercel --prod`
- **AWS S3**: Upload `dist/index.html` and enable static website hosting

## Development Mode

For development with hot reload:

```bash
npm install
npm run dev
```

This starts a development server at `http://localhost:5173`

## Important Notes

### Security

- The application runs entirely in the browser (client-side)
- No data is sent to any server
- All file processing happens locally
- Safe to use with sensitive financial data

### Browser Requirements

- Modern browser with JavaScript enabled
- Support for ES6+ features
- File API support for CSV/XLSX parsing

### File Size Considerations

- The built `index.html` is approximately 656 KB
- All dependencies are inlined (no external CDN dependencies)
- Works offline after initial load

## Troubleshooting

### Issue: Application not loading with Python HTTP server

**Solution**: Make sure you're running the server from the `dist` directory and accessing `http://localhost:8000` (not `file://` protocol).

### Issue: File upload not working

**Solution**: Ensure your browser allows file access. Some browsers may restrict file operations when using `file://` protocol. Use an HTTP server instead.

### Issue: "Module not found" errors during build

**Solution**: Run `npm install` to ensure all dependencies are installed.

### Issue: Styles not loading

**Solution**: This is fixed by using `base: './'` in vite.config.js, which uses relative paths. Make sure this is set correctly.

## Building for Different Base Paths

If you need to deploy to a subdirectory (e.g., `https://example.com/analyzer/`), modify `vite.config.js`:

```javascript
export default defineConfig({
  base: '/analyzer/',  // Change this to your subdirectory
  // ... rest of config
})
```

Then rebuild:

```bash
npm run build
```

## Production Checklist

- [ ] Run `npm run build`
- [ ] Test the built file locally with Python HTTP server
- [ ] Verify file upload functionality works
- [ ] Check all calculations produce correct results
- [ ] Test with different CSV/XLSX files
- [ ] Ensure responsive design works on mobile devices
- [ ] Verify offline functionality (after initial load)

## Performance Optimization

The application is already optimized for production:

- ✓ Single HTML file (no external dependencies)
- ✓ All assets inlined
- ✓ Gzipped size: ~216 KB
- ✓ Client-side processing (no server required)
- ✓ No database or backend needed

## Support

For issues or questions:
- Check the main README.md for usage instructions
- Review the code documentation in the src directory
- Ensure your data file follows the required format

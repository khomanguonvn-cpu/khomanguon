# Cloudflare R2 - CORS Configuration

## Step 1: Enable Public Access on R2 Bucket

1. Go to Cloudflare Dashboard: https://dash.cloudflare.com
2. Select your account → **R2** in the left sidebar
3. Click on your bucket **"gamevn"**
4. Go to **Settings** tab
5. Find **"Public access"** section
6. Enable it and add your custom domain binding:
   - Domain: `your-domain.com` (e.g., `khomanguon.io.vn` if using a subdomain)
   - Or use the default R2.dev URL: `https://d0e2768aafbfb45993fcf541f5ffc1e4.r2.cloudflarestorage.com`

## Step 2: Add CORS Rules

1. In the same bucket Settings page
2. Find **"CORS"** section
3. Add the following rule:

```json
[
  {
    "AllowedOrigins": [
      "https://khomanguon.io.vn",
      "https://www.khomanguon.io.vn",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "MaxAgeSeconds": 86400
  }
]
```

4. Save

## Step 3: If Using Custom Domain (Recommended)

1. Go to **R2** → **Custom Domains**
2. Add a subdomain like `cdn.khomanguon.io.vn`
3. Point it to your bucket
4. Update `.env`:
   ```
   R2_PUBLIC_URL=https://cdn.khomanguon.io.vn
   ```
5. Update the CORS rule with your custom domain

## Alternative: Use Cloudflare Workers (for full CORS control)

If public access doesn't work, create a Worker:

```javascript
// worker.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const objectKey = url.pathname.slice(1);
    
    const object = await env.KHOMANGUON_BUCKET.get(objectKey);
    if (!object) return new Response("Not Found", { status: 404 });
    
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }
};
```

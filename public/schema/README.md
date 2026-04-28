{
  "name": "KHOMANGUON Schema Files",
  "description": "Structured Data (JSON-LD) files for SEO",
  "usage": "Add to pages using <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /> or link via <link rel='alternate' type='application/rss+xml' href='/schema/*.json' />",
  "files": {
    "organization.json": "Organization schema - thông tin thương hiệu, liên hệ, mạng xã hội",
    "website.json": "WebSite schema - cấu hình tìm kiếm site-wide",
    "localbusiness.json": "LocalBusiness schema - thông tin doanh nghiệp cho Google Maps/SEO địa phương",
    "faq.json": "FAQ schema - câu hỏi thường gặp cho Google Rich Results (FAQ)",
    "product-template.json": "Product schema template - dùng cho từng sản phẩm (sinh động server-side)",
    "breadcrumb-template.json": "Breadcrumb schema template - navigation path cho Google"
  },
  "productSchemaFields": {
    "name": "Tên sản phẩm",
    "image": "URL ảnh sản phẩm",
    "description": "Mô tả sản phẩm",
    "sku": "Mã sản phẩm",
    "price": "Giá VND",
    "slug": "URL slug sản phẩm",
    "ratingValue": "Điểm đánh giá (1-5)",
    "reviewCount": "Số lượng đánh giá",
    "category": "Danh mục sản phẩm"
  },
  "breadcrumbs": {
    "homepage": { "position": 1, "name": "Trang chủ" },
    "products": { "position": 2, "name": "Sản phẩm" },
    "category": { "position": 3, "name": "Tên danh mục" },
    "product": { "position": 4, "name": "Tên sản phẩm" }
  }
}

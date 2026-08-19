# Our Kitchen — Product Image Optimization Pipeline

## Objective

Keep product photography **outside the application repository and database**, make product pages load quickly on mobile and desktop, and preserve high-quality originals for future reuse. The current application already uploads product images to managed object storage and stores only a reference URL/key in the database. The pipeline below extends that approach for a large catalog.

> Do not place original product photographs in `client/public`, `client/src`, or database BLOB columns. Those locations increase deployment size, slow builds, and make media maintenance harder.

## Recommended architecture

| Stage | Recommended responsibility | Location |
|---|---|---|
| Original upload | Administrator selects the original image in the product editor | Browser → protected Laravel endpoint |
| Validation | Check authenticated admin role, file type, size, and dimensions | Laravel |
| Original archive | Preserve the unmodified source for future crops or print work | Managed S3/object storage |
| Optimization | Produce WebP/AVIF delivery versions, resize, compress, and optionally crop | External image service or dedicated image worker |
| Delivery | Serve responsive variants through a CDN with cache headers | Image service/CDN |
| Product record | Save only media identifiers and delivery URLs/variant metadata | TiDB database |

## Variant policy

Store one original, then deliver the smallest useful rendition for each screen surface.

| Usage | Target width | Format preference | Notes |
|---|---:|---|---|
| Cart / compact results | 240–320 px | WebP, with JPEG fallback | Smallest practical image |
| Product cards | 480–640 px | WebP or AVIF | The common storefront grid image |
| Product detail gallery | 1200–1600 px | WebP or AVIF | Preserve product detail without serving the original |
| Zoom / editorial hero | 2000 px maximum | WebP/JPEG | Use only where large display is intentional |

The browser should receive responsive `srcset` candidates where possible, so a phone does not download a 1600 px asset merely to display a 320 px product card.

## Recommended implementation options

### Option A — Dedicated image delivery service (recommended for a growing catalog)

Use a service such as **Cloudinary**, **ImageKit**, or a comparable image CDN. Laravel sends the original through a server-authorized upload path. The service retains the original, creates delivery renditions on demand or at upload time, and serves compressed WebP/AVIF images through its CDN.

This is the least operationally heavy option because it avoids adding image-processing binaries and background workers to the application runtime. It also keeps file transfer, transformation, caching, and responsive delivery away from the storefront deployment.

### Option B — Managed object storage plus a transformation worker

Keep the current managed S3 storage as the source of truth. On upload, enqueue an image-processing job that creates the variant policy above and writes results back to storage. A CDN then serves the variants.

This gives maximum control but requires an always-available worker or image-processing service, a queue, monitoring, retry handling, and image tooling such as libvips or ImageMagick. It is best chosen when a dedicated image service is not acceptable.

## Safe upload workflow

1. An authenticated administrator chooses an image from the Product Library.
2. Laravel verifies administrator role and validates MIME type, pixel dimensions, and a conservative upload limit.
3. The original file receives a unique object-storage key, such as `our-kitchen/products/original/{uuid}.jpg`.
4. The external service or worker writes optimized delivery variants under a separate prefix, such as `our-kitchen/products/derived/{uuid}/640.webp`.
5. The database stores the original key, an asset identifier, the preferred display URL, and optional variant metadata—not file bytes.
6. Product cards use the 480–640 px rendition; galleries request 1200–1600 px; the original remains private or restricted.
7. Replacing a product image creates a new asset version. Delete old derived variants only after the product record has been updated successfully.

## Suggested future product-media model

The current product `image` and `gallery` URL fields are suitable for the existing catalog. Before introducing transformations at scale, add a media asset record with fields similar to:

| Field | Purpose |
|---|---|
| `id` | Stable media asset identifier |
| `original_key` | Private/object-storage source file key |
| `provider_asset_id` | Image-service identifier, if used |
| `display_url` | Default optimized image URL |
| `variants` | JSON map for widths/formats/crops |
| `alt_text_en` / `alt_text_ar` | Accessible bilingual descriptions |
| `width` / `height` | Layout stability and transformation decisions |
| `created_by` | Administrator ownership/audit information |

## Operational rules

- Keep originals only in external object storage or the selected image provider.
- Reject non-image uploads and impose both byte-size and pixel-dimension limits.
- Preserve original aspect ratio for products unless a defined card crop is needed.
- Use deterministic, versioned delivery URLs so CDN caches invalidate safely after replacement.
- Add `loading="lazy"` to below-the-fold product imagery and define image dimensions to reduce layout movement.
- Record alt text in English and Arabic for accessible catalog presentation.
- Never store user image bytes directly in TiDB.

## What we can implement next

To activate **Option A**, choose an image service/provider and provide its server-side credentials. I can then add the secured upload integration, responsive image URLs, variant metadata, and an administrator media workflow. The application will remain small because it will still store only references to externally hosted image assets.

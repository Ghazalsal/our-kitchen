# Injazat application-owned media storage

Our Kitchen no longer sends new product or category uploads to Manus storage. Administrator uploads are written by Laravel to the dedicated `kitchen_media` filesystem disk and served through `/media/{key}`. MySQL stores the file path and metadata in `kitchen_media_files`; image bytes are not stored as database BLOBs.

| Runtime item | Location |
|---|---|
| Bundled logo | `public/images/logo.png` after the frontend build |
| Bundled catalog images | `public/catalog/` after the frontend build |
| New product uploads | `storage/app/kitchen-media/products/` |
| New category uploads | `storage/app/kitchen-media/categories/` |
| Database metadata | `kitchen_media_files` |

## Required Injazat persistent volume

The deployed container must mount a persistent writable volume at:

```text
/var/www/html/storage/app/kitchen-media
```

If Injazat uses a different host-side volume name, map that volume to the container path above. Do not mount over the entire `storage` directory unless the deployment also preserves Laravel logs, cache, and framework directories with correct permissions.

The PHP process must have read/write access to the mounted directory. The Docker image runs the application from `/var/www/html`; the upload path therefore remains stable across releases as long as the volume mount is retained.

## Upload and database behavior

Only authenticated administrators can post to `/api/media`. Laravel validates the file as JPEG, PNG, WebP, or AVIF, enforces a 5 MB limit, assigns a server-generated UUID filename, and rejects unsupported content. The administrator provides `purpose=product` or `purpose=category` plus the draft entity ID.

The `kitchen_media_files` table stores:

| Column | Purpose |
|---|---|
| `id` | Media record identifier |
| `purpose` | `product` or `category` |
| `entityId` | Associated product/category identifier |
| `storageKey` | Relative file path on the media disk |
| `url` | Customer-facing `/media/...` URL |
| `filename` | Original filename for administration |
| `contentType` | Verified MIME type |
| `size` | Uploaded byte size |

Public media requests are constrained to generated product/category paths, return an explicit MIME type, use immutable cache headers, and include `X-Content-Type-Options: nosniff`.

## Backup and recovery

The MySQL database and the persistent media volume must be backed up together. A database-only backup restores paths and metadata but not image files. A media-only backup restores files but not their product/category relationships.

Before every release, retain the existing volume mount. For recovery, restore the MySQL snapshot and the matching `kitchen-media` volume snapshot from the same backup window, then verify a product image and a category image through their `/media/...` URLs.

## Existing catalog media

The logo and seed catalog images are bundled in the repository as PNG, JPEG, and WebP files. Known database references have been migrated from `/manus-storage/...` to `/catalog/...`. The active Laravel media path has no Manus storage route; all new uploads use `/media/...` and the application-owned disk.

## Validation record

The completed implementation was checked with 28 passing Vitest assertions, a Laravel media behavior test with 10 assertions, TypeScript validation, and PHP syntax validation. Runtime checks confirmed that the logo is served as `image/png`, the hero as `image/webp`, and category imagery as `image/jpeg`. The public catalog API contains the full 12-product catalog and no `/manus-storage/` references.

The release checkpoint description must identify the bundled local branding, application-owned product/category uploads, MySQL media ownership metadata, localized seed catalog imagery, required Injazat volume mount, and the removal of active Manus media routes.

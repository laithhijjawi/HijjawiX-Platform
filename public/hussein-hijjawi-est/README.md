# Hussein Hijjawi Est. | Image provenance and project gallery

This bilingual company page belongs to Hijjawi X at `/hussein-hijjawi-est/`.

## Mandatory visual-source rules

1. **Real projects:** use only photographs taken from original posts on the official Hussein Hijjawi Est. Facebook page: https://www.facebook.com/share/14yVts7K8kX/. Keep an original Facebook post URL alongside each project. Never attribute a stock image, AI-generated image, or third-party contractor's work to the establishment.
2. **Supplementary illustrations:** use only original AI-generated/commissioned media when necessary. Label them *"صورة توضيحية مولدة رقمياً / AI-generated illustration"* and keep them out of the completed-project gallery.
3. **Hosting:** after permission to reuse photos is verified, place optimized image files in `public/hussein-hijjawi-est/media/` and reference them with local paths. Do not hotlink Facebook CDN image URLs (they can expire and have access restrictions).
4. **Project metadata:** confirm project name, site/location, date and description from the original post before adding it. If unsure, omit the field; never invent client names or dates.
5. **Rights and consent:** use media the establishment owns or has permission to republish. Avoid including faces, number plates, private locations, or client-identifying details without appropriate permission.

## Add a verified project
Add an entry to `public/hussein-hijjawi-est/projects.json`:

```json
{
  "projects": [
    {
      "status": "verified",
      "titleAr": "اسم المشروع المعتمد",
      "titleEn": "Verified project name",
      "descriptionAr": "وصف مثبت في المنشور",
      "descriptionEn": "Description based on the source post",
      "date": "YYYY-MM-DD",
      "sourceUrl": "https://www.facebook.com/...",
      "images": [
        {
          "src": "/hussein-hijjawi-est/media/example.webp",
          "altAr": "وصف الصورة",
          "altEn": "Description of original photograph"
        }
      ]
    }
  ]
}
```

Remove the example and insert only verified metadata. The page enforces a Facebook source URL and a local media path, and builds DOM elements with textContent.

## Current status
- Source PDF reviewed; brochure gives technical applications and indicative system specs.
- Facebook share link provided by user. The public-content fetch was blocked, so there are **no verified project photographs** in the gallery yet.
- The hero decorative illustration is labeled as non-project imagery.
- Two original generated illustration concepts were created during design, but are **not yet committed as website media**.
- The change is on the `feature/hussein-hijjawi-est-site` branch and is not published to production.

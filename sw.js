const CACHE_NAME = "longshots-shared-images";

self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function(event) {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method === "POST" &&
    url.pathname.endsWith("/share/")
  ) {
    event.respondWith(handleSharedImage(request));
  }
});

async function handleSharedImage(request) {
  try {
    const formData = await request.formData();

    let image = null;

    // Look through every submitted field for an image.
    for (const [fieldName, value] of formData.entries()) {
      if (
        value &&
        typeof value.arrayBuffer === "function" &&
        typeof value.type === "string"
      ) {
        const fileName = value.name || "";

        const isImage =
          value.type.startsWith("image/") ||
          /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(fileName);

        if (isImage) {
          image = value;
          break;
        }
      }
    }

    if (!image) {
      const receivedFields = Array.from(formData.keys()).join(", ");

      return new Response(
        "No valid image received. Fields found: " +
        (receivedFields || "none"),
        { status: 400 }
      );
    }

    const cache = await caches.open(CACHE_NAME);

    const imageUrl = new URL(
      "shared-image",
      self.registration.scope
    );

    await cache.put(
      imageUrl,
      new Response(image, {
        headers: {
          "Content-Type": image.type || "image/jpeg"
        }
      })
    );

    return Response.redirect(
      new URL("?shared=1", self.registration.scope).href,
      303
    );

  } catch (error) {
    return new Response(
      "Image receiving error: " + error.message,
      { status: 500 }
    );
  }
}

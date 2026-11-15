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
    const image = formData.get("screenshot");

    if (!image || !image.type.startsWith("image/")) {
      return new Response("No valid image received.", {
        status: 400
      });
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
          "Content-Type": image.type
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

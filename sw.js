const CACHE_NAME = "longshots-share-v1";
const IMAGE_PATH = "shared-image";

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Catch images shared from Android.
  if (
    event.request.method === "POST" &&
    url.pathname.endsWith("/share/")
  ) {
    event.respondWith(receiveSharedImage(event.request));
    return;
  }

  // Serve the app's normal pages from GitHub Pages.
  if (event.request.method === "GET") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});

async function receiveSharedImage(request) {
  try {
    const formData = await request.formData();
    const image = formData.get("screenshot");

    if (!image || !image.type || !image.type.startsWith("image/")) {
      return new Response("No valid image was received.", {
        status: 400,
        headers: { "Content-Type": "text/plain" }
      });
    }

    const cache = await caches.open(CACHE_NAME);

    const imageUrl = new URL(IMAGE_PATH, self.registration.scope);

    await cache.put(
      imageUrl,
      new Response(image, {
        headers: {
          "Content-Type": image.type
        }
      })
    );

    const destination = new URL(
      "?shared=1",
      self.registration.scope
    );

    return Response.redirect(destination.toString(), 303);

  } catch (error) {
    return new Response("Image receiving failed: " + error.message, {
      status: 500,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

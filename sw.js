
const CACHE_NAME = "longshots-shared-images";

self.addEventListener("install", event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  const appPath = new URL(self.registration.scope).pathname;

  if (
    request.method === "POST" &&
    url.origin === self.location.origin &&
    url.pathname === appPath
  ) {
    event.respondWith(handleSharedImage(request));
  }
});

async function handleSharedImage(request) {
  try {
    const formData = await request.formData();

    // Accept either field name during the transition.
    let files = [
      ...formData.getAll("file"),
      ...formData.getAll("screenshot")
    ];

    const image = files.find(file =>
      file instanceof File &&
      file.size > 0 &&
      file.type.startsWith("image/")
    );

    if (!image) {
      return new Response(
        "No image received. Form fields: " +
        [...formData.keys()].join(", "),
        {
          status: 400,
          headers: {
            "Content-Type": "text/plain"
          }
        }
      );
    }

    const cache = await caches.open(CACHE_NAME);

    const imageKey = new URL(
      "shared-image",
      self.registration.scope
    ).href;

    await cache.put(
      imageKey,
      new Response(image, {
        headers: {
          "Content-Type": image.type,
          "Content-Disposition": "inline"
        }
      })
    );

    const destination = new URL(
      "?shared=1",
      self.registration.scope
    );

    return Response.redirect(destination.href, 303);

  } catch (error) {
    return new Response(
      "SHARE ERROR: " + error.message,
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain"
        }
      }
    );
  }
}

const CACHE_NAME = "longshots-shared-images";

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  if (
    event.request.method === "POST" &&
    url.pathname.endsWith("/share/")
  ) {
    event.respondWith(handleSharedImage(event.request));
  }
});

async function handleSharedImage(request) {
  try {
    const contentType = request.headers.get("content-type") || "unknown";
    const body = await request.clone().arrayBuffer();

    let formData;

    try {
      formData = await request.formData();
    } catch (error) {
      return diagnostic(
        "FORM DATA ERROR: " + error.message +
        "\nContent type: " + contentType +
        "\nBody size: " + body.byteLength
      );
    }

    const fields = Array.from(formData.keys());

    let image = null;

    for (const [name, value] of formData.entries()) {
      if (value && typeof value.arrayBuffer === "function") {
        if (
          (value.type || "").startsWith("image/") ||
          /\.(jpg|jpeg|png|webp|gif)$/i.test(value.name || "")
        ) {
          image = value;
          break;
        }
      }
    }

    if (!image) {
      return diagnostic(
        "NO IMAGE FOUND" +
        "\nFields: " + (fields.join(", ") || "none") +
        "\nContent type: " + contentType +
        "\nBody size: " + body.byteLength
      );
    }

    const cache = await caches.open(CACHE_NAME);

    await cache.put(
      new URL("shared-image", self.registration.scope),
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
    return diagnostic("ERROR: " + error.message);
  }
}

function diagnostic(message) {
  return new Response(message, {
    status: 200,
    headers: {
      "Content-Type": "text/plain"
    }
  });
}

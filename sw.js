
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
  const contentType = request.headers.get("content-type") || "unknown";

  try {
    const body = await request.arrayBuffer();

    let details =
      "CONTENT TYPE: " + contentType +
      "\nBODY SIZE: " + body.byteLength +
      "\nURL: " + request.url;

    if (body.byteLength > 0) {
      const preview = new TextDecoder().decode(
        body.slice(0, Math.min(body.byteLength, 500))
      );

      details += "\n\nBODY PREVIEW:\n" + preview;
    }

    return new Response(details, {
      status: 200,
      headers: {
        "Content-Type": "text/plain"
      }
    });

  } catch (error) {
    return new Response(
      "REQUEST ERROR: " + error.message,
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain"
        }
      }
    );
  }
}

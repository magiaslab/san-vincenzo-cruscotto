import { MAP_CENTER } from "@/lib/constants";

export async function GET() {
  const [lat, lon] = MAP_CENTER;
  const html = `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>VesselFinder</title>
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #e8eef4; }
    </style>
  </head>
  <body>
    <script>
      var width = "100%";
      var height = "480";
      var latitude = "${lat}";
      var longitude = "${lon}";
      var zoom = "14";
      var names = true;
    </script>
    <script src="https://www.vesselfinder.com/aismap.js"></script>
  </body>
</html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

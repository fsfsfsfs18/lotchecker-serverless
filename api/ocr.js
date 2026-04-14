import multer from "multer";

const upload = multer();

export const config = {
  api: { bodyParser: false }
};

export default function handler(req, res) {
  // CORS voor jouw GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "https://fsfsfsfs18.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  upload.single("image")(req, {}, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed" });
      return;
    }

    try {
      const base64 = req.file.buffer.toString("base64");

      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64 },
                features: [{ type: "TEXT_DETECTION" }]
              }
            ]
          })
        }
      );

      const data = await response.json();
      console.log("Vision raw response:", JSON.stringify(data, null, 2));

      const text =
        data.responses?.[0]?.fullTextAnnotation?.text ||
        data.responses?.[0]?.textAnnotations?.[0]?.description ||
        "";

      res.status(200).json({ text: (text || "").trim() });
    } catch (e) {
      console.error("Vision API error:", e);
      res.status(500).json({ error: "OCR failed" });
    }
  });
}
import multer from "multer";

const upload = multer();

export const config = {
  api: { bodyParser: false }
};

export default function handler(req, res) {
  // CORS naar jouw GitHub Pages
  res.setHeader("Access-Control-Allow-Origin", "https://fsfsfsfs18.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  upload.single("image")(req, {}, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      return res.status(500).json({ error: "Upload failed" });
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

      const rawText =
        data.responses?.[0]?.fullTextAnnotation?.text ||
        data.responses?.[0]?.textAnnotations?.[0]?.description ||
        "";

      const flat = (rawText || "").replace(/\s+/g, " ").trim();

      // simpele patronen: 1 letter + 8 cijfers (lot) en dd/mm/yyyy (datum)
      const lotMatch = flat.match(/[A-Z]\d{8}/);
      const dateMatch = flat.match(/\b\d{2}\/\d{2}\/\d{4}\b/);

      const lotNumber = lotMatch ? lotMatch[0] : null;
      const date = dateMatch ? dateMatch[0] : null;

      return res.status(200).json({
        rawText,
        lotNumber,
        date
      });
    } catch (e) {
      console.error("Vision API error:", e);
      return res.status(500).json({ error: "OCR failed" });
    }
  });
}
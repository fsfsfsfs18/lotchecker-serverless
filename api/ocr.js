import multer from "multer";

const upload = multer();

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://fsfsfsfs18.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  upload.single("image")(req, {}, async (err) => {
    if (err) return res.status(500).json({ error: "Upload failed" });

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
      const text = data.responses?.[0]?.fullTextAnnotation?.text || "";

      res.status(200).json({ text });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "OCR failed" });
    }
  });
}
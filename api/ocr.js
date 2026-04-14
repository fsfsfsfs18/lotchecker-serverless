import vision from "@google-cloud/vision";
import multer from "multer";

const upload = multer();

const client = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY
  }
});

export const config = {
  api: { bodyParser: false }
};

export default function handler(req, res) {
  // ✅ CORS‑headers
  res.setHeader("Access-Control-Allow-Origin", "https://fsfsfsfs18.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Preflight‑check
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
      const [result] = await client.textDetection(req.file.buffer);
      const detections = result.textAnnotations || [];
      const text = detections.length ? detections[0].description : "";
      res.status(200).json({ text });
    } catch (e) {
      console.error("Vision API error:", e);
      res.status(500).json({ error: "OCR failed" });
    }
  });
}
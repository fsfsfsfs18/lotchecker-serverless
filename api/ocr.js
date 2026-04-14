import vision from "@google-cloud/vision";
import multer from "multer";

const upload = multer();

// Google Vision client via environment variables (Vercel)
const client = new vision.ImageAnnotatorClient({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY
  }
});

// Nodig voor Multer (anders crasht Vercel)
export const config = {
  api: {
    bodyParser: false
  }
};

export default function handler(req, res) {
  // ------------------------------------
  // CORS HEADERS (VERPLICHT VOOR GITHUB)
  // ------------------------------------
  res.setHeader("Access-Control-Allow-Origin", "https://fsfsfsfs18.github.io");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Alleen POST toegestaan
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // ------------------------------------
  // Multer: image upload verwerken
  // ------------------------------------
  upload.single("image")(req, {}, async (err) => {
    if (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: "Upload failed" });
      return;
    }

    try {
      // Vision OCR uitvoeren
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
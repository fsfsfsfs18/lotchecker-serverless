import vision from "@google-cloud/vision";
import multer from "multer";

const upload = multer();

const client = new vision.ImageAnnotatorClient({
  keyFilename: "./key.json"
});

export const config = {
  api: {
    bodyParser: false
  }
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  upload.single("image")(req, {}, async (err) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Upload failed" });
      return;
    }

    try {
      const [result] = await client.textDetection(req.file.buffer);
      const detections = result.textAnnotations || [];
      const text = detections.length ? detections[0].description : "";
      res.status(200).json({ text });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "OCR failed" });
    }
  });
}
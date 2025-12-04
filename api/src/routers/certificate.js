import express from "express";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import path from "path";
import fs from "fs";

const certificateRouter = express.Router();

certificateRouter.post("/generate-certificate", async (req, res) => {
  const { name, course, date } = req.body;

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    //Read and Add logo to certificate
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const logoImage = await fs.promises.readFile(logoPath);
    const logo = await pdfDoc.embedPng(logoImage);

    //Calculate logo dimension
    const logoWidth = 200;
    const logoHeight = (logo.height / logo.width) * logoWidth;

    //Draw border
    page.drawRectangle({
      x: 50,
      y: 50,
      width: width - 100,
      height: height - 100,
      borderColor: rgb(115 / 255, 115 / 255, 115 / 255),
      borderWidth: 5,
      color: rgb(1, 1, 1, 0),
    });

    // Inner border
    page.drawRectangle({
      x: 60,
      y: 60,
      width: width - 120,
      height: height - 120,
      borderColor: rgb(0, 0, 0), // Gold color
      borderWidth: 1,
      color: rgb(1, 1, 1, 0), // Transparent fill
    });

    // Draw corner decorations
    const cornerSize = 20;
    // Top left corner
    page.drawLine({
      start: { x: 50, y: 70 },
      end: { x: 70, y: 50 },
      thickness: 2,
      color: rgb(115 / 255, 115 / 255, 115 / 255),
    });

    // Top right corner
    page.drawLine({
      start: { x: width - 50, y: 70 },
      end: { x: width - 70, y: 50 },
      thickness: 2,
      color: rgb(0, 0, 0),
    });
    // Bottom left corner
    page.drawLine({
      start: { x: 50, y: height - 70 },
      end: { x: 70, y: height - 50 },
      thickness: 2,
      color: rgb(0, 0, 0),
    });
    // Bottom right corner
    page.drawLine({
      start: { x: width - 50, y: height - 70 },
      end: { x: width - 70, y: height - 50 },
      thickness: 2,
      color: rgb(115 / 255, 115 / 255, 115 / 255),
    });

    //insert the logo
    page.drawImage(logo, {
      x: (width - logoWidth) / 2,
      y: height - 150,
      width: logoWidth,
      height: logoHeight,
    });

    //Title
    const titleText = "Certificate of completion";
    const titleWidth = boldFont.widthOfTextAtSize(titleText, 36);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 200,
      size: 36,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    //Certificate Text
    const certText = "Certificate of completion";
    const certWidth = boldFont.widthOfTextAtSize(certText, 18);
    page.drawText(certText, {
      x: (width - certWidth) / 2,
      y: height - 280,
      size: 18,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Name
    const nameWidth = boldFont.widthOfTextAtSize(name, 32);
    page.drawText(name, {
      x: (width - nameWidth) / 2,
      y: height - 330,
      size: 32,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Course completion text
    const completionText = "has successfully completed the course";
    const completionWidth = font.widthOfTextAtSize(completionText, 18);
    page.drawText(completionText, {
      x: (width - completionWidth) / 2,
      y: height - 380,
      size: 18,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Course name
    const courseWidth = boldFont.widthOfTextAtSize(course, 24);
    page.drawText(course, {
      x: (width - courseWidth) / 2,
      y: height - 420,
      size: 24,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Date
    const dateText = `Completed on ${date}`;
    const dateWidth = font.widthOfTextAtSize(dateText, 14);
    page.drawText(dateText, {
      x: (width - dateWidth) / 2,
      y: 100,
      size: 14,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Verify the PDF
    const verifyText =
      "This certificate has been verified by the UpSkillPro Team";
    const verifyWidth = font.widthOfTextAtSize(verifyText, 14);
    page.drawText(verifyText, {
      x: (width - verifyWidth) / 2,
      y: 70,
      font,
      size: 12,
    });

    //Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    //Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="certificate.pdf',
    );
    res.setHeader("Content-Length", buffer.length);

    // Send the buffer
    res.send(buffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res
      .status(500)
      .json({ message: "Failed to generate PDF", error: error.message });
  }
});

export default certificateRouter;

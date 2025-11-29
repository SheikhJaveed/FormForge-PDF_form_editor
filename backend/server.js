const express = require('express');
const multer = require('multer');
// Import 'rgb' to set colors
const { PDFDocument, StandardFonts, PDFName, PDFString, TextAlignment, rgb } = require('pdf-lib');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

app.post('/process-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const fields = JSON.parse(req.body.fields);
    const existingPdfBytes = fs.readFileSync(req.file.path);
    
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();

    fields.forEach(field => {
      const page = pdfDoc.getPage(field.page);
      
      // --- SCALING LOGIC ---
      const { width: pdfWidth, height: pdfHeight } = page.getSize();
      const frontendWidth = 800; 
      const scaleFactor = pdfWidth / frontendWidth;

      const scaledX = field.x * scaleFactor;
      const scaledY = field.y * scaleFactor;
      const scaledW = field.w * scaleFactor;
      const scaledH = field.h * scaleFactor;

      const pdfY = pdfHeight - scaledY - scaledH;

      if (field.type === 'text') {
        const textField = form.createTextField(field.name);
        textField.setText(''); 

        // --- FONT SIZE & DA ---
        const fontSize = (field.fontSize || 11) * scaleFactor;
        
        // Manually set Default Appearance string
        const daString = `/Helv ${fontSize} Tf 0 g`;
        textField.acroField.dict.set(PDFName.of('DA'), PDFString.of(daString));

        // --- ALIGNMENT ---
        if (field.align) {
          switch (field.align) {
            case 'center': textField.setAlignment(TextAlignment.Center); break;
            case 'right': textField.setAlignment(TextAlignment.Right); break;
            case 'left': default: textField.setAlignment(TextAlignment.Left); break;
          }
        }

        if (field.required) textField.enableRequired();

        // --- ADD TO PAGE (STYLES GO HERE) ---
        // IMPORTANT: backgroundColor and borderWidth must be passed HERE, not as functions.
        textField.addToPage(page, {
          x: scaledX,
          y: pdfY,
          width: scaledW,
          height: scaledH,
          font: helveticaFont,
          
          // Style settings:
          borderWidth: 0, 
          backgroundColor: rgb(1, 1, 1), // Light Blue
        });

      } else if (field.type === 'checkbox') {
        const checkBox = form.createCheckBox(field.name);
        
        if (field.required) checkBox.enableRequired();
        
        checkBox.addToPage(page, {
          x: scaledX,
          y: pdfY,
          width: scaledW,
          height: scaledH,
          
          // Style settings:
          borderWidth: 0,
          backgroundColor: rgb(1, 1, 1), // Light Green
        });
      }
    });

    const pdfBytes = await pdfDoc.save();
    
    // Clean up
    if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error("Backend Error:", err); 
    res.status(500).send('Error processing PDF');
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
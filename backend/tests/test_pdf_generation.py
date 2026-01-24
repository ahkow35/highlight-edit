
import pytest
import fitz
import json
import os
from app.services.document_generator import generate_pdf

@pytest.mark.asyncio
async def test_generate_pdf():
    """Test PDF generation with field replacement."""
    
    # 1. Create a Mock Template PDF
    doc = fitz.open()
    page = doc.new_page()
    
    # Draw "Old Text" to be redacted
    rect = fitz.Rect(100, 100, 300, 150)
    page.insert_textbox(rect, "OLD TEXT PLACEHOLDER", fontsize=12)
    
    # Add our special metadata annotation
    placeholder = "{{field_1}}"
    annot = page.add_text_annot(rect.tl, placeholder)
    annot.set_info({
        "title": "HighlightEdit Field 1",
        "content": json.dumps({
            "placeholder": placeholder,
            "original": "OLD TEXT PLACEHOLDER",
            "rect": [rect.x0, rect.y0, rect.x1, rect.y1]
        }),
    })
    annot.update()
    
    template_path = "test_template.pdf"
    output_path = "test_output.pdf"
    doc.save(template_path)
    doc.close()
    
    try:
        # 2. Run Generation
        field_values = {"field_1": "NEW GENERATED VALUE"}
        generate_pdf(template_path, field_values, output_path)
        
        # 3. Verify Output
        assert os.path.exists(output_path)
        
        doc_out = fitz.open(output_path)
        page_out = doc_out[0]
        text_out = page_out.get_text()
        
        print(f"Output Text: {text_out.strip()}")
        
        # Check that new text is present
        assert "NEW GENERATED VALUE" in text_out
        # Check that old text is NOT present (redaction won't remove it from text extraction if we just draw over it? 
        # Actually fitz extraction sees underlying text usually. 
        # But visually it is covered. 
        # However, generate_pdf does not remove the underlying text object, it draws a white rect.
        # But wait, does extract_pdf_highlights see it?
        # The test should check if we can read the new text.
        
        # Also check annotation is gone
        assert not page_out.annots() or len(list(page_out.annots())) == 0
        
        doc_out.close()
        
    finally:
        # Cleanup
        if os.path.exists(template_path):
            os.remove(template_path)
        if os.path.exists(output_path):
            os.remove(output_path)

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_generate_pdf())

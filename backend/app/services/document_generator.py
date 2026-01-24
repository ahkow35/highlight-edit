"""
Document Generator Service

Generates final documents by:
1. Loading template files with placeholders
2. Injecting user values into placeholders
3. Stripping all highlight formatting
4. Returning clean documents with original font styles preserved
"""

import os
import re
from io import BytesIO
from typing import Dict, Optional
from copy import deepcopy

from docx import Document
from docx.shared import RGBColor
from docx.enum.text import WD_COLOR_INDEX
from docx.oxml.ns import qn


def generate_docx(
    template_path: str,
    field_values: Dict[str, str],
    output_path: Optional[str] = None,
) -> bytes:
    """
    Generate a DOCX document with placeholders replaced by user values.
    
    Args:
        template_path: Path to the template DOCX file
        field_values: Dict mapping field names (field_1, field_2, etc.) to values
        output_path: Optional path to save the output file
        
    Returns:
        Generated document as bytes
    """
    # Load the template
    doc = Document(template_path)
    
    # Process all paragraphs
    for paragraph in doc.paragraphs:
        _process_paragraph(paragraph, field_values)
    
    # Process all tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    _process_paragraph(paragraph, field_values)
    
    # Process headers and footers
    for section in doc.sections:
        # Header
        if section.header:
            for paragraph in section.header.paragraphs:
                _process_paragraph(paragraph, field_values)
        # Footer
        if section.footer:
            for paragraph in section.footer.paragraphs:
                _process_paragraph(paragraph, field_values)
    
    # Save to bytes
    output_buffer = BytesIO()
    doc.save(output_buffer)
    output_buffer.seek(0)
    
    # Optionally save to file
    if output_path:
        with open(output_path, 'wb') as f:
            f.write(output_buffer.getvalue())
        output_buffer.seek(0)
    
    return output_buffer.getvalue()


def _process_paragraph(paragraph, field_values: Dict[str, str]):
    """
    Process a paragraph: replace placeholders and strip highlights.
    
    Preserves original font styles while:
    - Replacing {{field_N}} placeholders with user values
    - Removing any remaining yellow highlight formatting
    """
    for run in paragraph.runs:
        text = run.text
        
        # Replace placeholders with user values
        for field_name, value in field_values.items():
            # Support multiple placeholder formats
            patterns = [
                f"{{{{{field_name}}}}}",      # {{field_1}}
                f"{{{{ {field_name} }}}}",    # {{ field_1 }}
            ]
            for pattern in patterns:
                if pattern in text:
                    text = text.replace(pattern, value)
        
        if text != run.text:
            run.text = text
        
        # CRITICAL: Strip ALL highlight formatting
        _strip_highlight(run)


def _strip_highlight(run):
    """
    Remove highlight formatting from a run while preserving other styles.
    
    This ensures the output document has no yellow highlights.
    """
    # Method 1: Set highlight_color to None via python-docx
    try:
        run.font.highlight_color = None
    except Exception:
        pass
    
    # Method 2: Remove highlight via XML (more thorough)
    try:
        # Access the run's XML properties
        rPr = run._r.get_or_add_rPr()
        
        # Find and remove highlight element
        highlight_elem = rPr.find(qn('w:highlight'))
        if highlight_elem is not None:
            rPr.remove(highlight_elem)
        
        # Also check for shading (sometimes used instead of highlight)
        shd_elem = rPr.find(qn('w:shd'))
        if shd_elem is not None:
            # Check if it's a yellow-ish color
            fill = shd_elem.get(qn('w:fill'), '').upper()
            if fill in ['FFFF00', 'FFFF99', 'FFFFCC', 'FFFFE0', 'YELLOW']:
                rPr.remove(shd_elem)
                
    except Exception:
        pass


def generate_docx_stream(
    template_path: str,
    field_values: Dict[str, str],
) -> BytesIO:
    """
    Generate a DOCX document and return as a BytesIO stream.
    
    Args:
        template_path: Path to the template DOCX file
        field_values: Dict mapping field names to values
        
    Returns:
        BytesIO stream containing the generated document
    """
    doc_bytes = generate_docx(template_path, field_values)
    return BytesIO(doc_bytes)


def strip_all_highlights_from_docx(doc_path: str, output_path: str) -> None:
    """
    Utility function to strip all highlights from a DOCX file.
    
    Useful for cleaning up template files or existing documents.
    """
    doc = Document(doc_path)
    
    for paragraph in doc.paragraphs:
        for run in paragraph.runs:
            _strip_highlight(run)
    
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        _strip_highlight(run)
    
    doc.save(output_path)


    return f"{prefix}{name}{ext}"


def generate_pdf(
    template_path: str,
    field_values: Dict[str, str],
    output_path: Optional[str] = None,
) -> bytes:
    """
    Generate a PDF document with placeholders replaced by user values.

    Args:
        template_path: Path to the template PDF file
        field_values: Dict mapping field names (field_1, field_2, etc.) to values
        output_path: Optional path to save the output file

    Returns:
        Generated document as bytes
    """
    import fitz
    import json
    
    # Load the template
    doc = fitz.open(template_path)
    
    # Iterate through all pages
    for page in doc:
        # Collect replacements for this page
        # Format: (rect, new_text, alignment_info)
        replacements = []
        
        # Get all annotations
        # annotations is a generator
        
        count = 0
        annots_to_delete = []
        replacements = []
        
        # We must iterate the generator.
        for annot in page.annots():
            count += 1
            # Check for Text annotation (Sticky Note) - Type 0
            if annot.type[0] == 0:
                info = annot.info
                content = info.get("content", "")
                
                try:
                    metadata = json.loads(content)
                    placeholder = metadata.get("placeholder")
                    
                    if not placeholder:
                        continue
                        
                    key = placeholder.replace("{{", "").replace("}}", "").strip()
                    
                    if key in field_values:
                        user_value = field_values.get(key, "")
                        rect_coords = metadata.get("rect")
                        
                        if rect_coords:
                             target_rect = fitz.Rect(rect_coords)
                        else:
                             target_rect = annot.rect
                        
                        # Store replacement info
                        replacements.append((target_rect, str(user_value)))
                        annots_to_delete.append(annot)
                        page.add_redact_annot(target_rect, fill=(1, 1, 1))
                        
                    else:
                        pass
                        
                except json.JSONDecodeError:
                    continue
                except Exception as e:
                    # print(f"Error processing annotation: {e}") # Removed print statement
                    continue
        
        
        if replacements:
            page.apply_redactions()
        
        # Apply Redactions (removes old text and draws white fill)
        # This physically removes content
        page.apply_redactions()
        
        # Remove the marker annotations
        for annot in annots_to_delete:
            page.delete_annot(annot)
            
        # Draw new text
        for rect, text in replacements:
            # Insert text
            # Auto-scale font?
            fontsize = 11
            if rect.height > 0:
                # Approximate header/body size heuristic
                # But safer to pick a standard readable size or match original?
                # We don't know original font size easily without parsing more.
                # Let's pick a sane default or limit.
                fontsize = min(rect.height * 0.7, 12) 
            
            page.insert_textbox(
                rect, 
                text, 
                fontsize=fontsize,
                fontname="helv", 
                color=(0, 0, 0),
                align=0
            )

    # Save to bytes
    output_bytes = doc.tobytes(garbage=4)
    doc.close()

    # Optionally save to file
    if output_path:
        with open(output_path, 'wb') as f:
            f.write(output_bytes)

    return output_bytes


import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.services.pdf_parser import extract_pdf_highlights
    print("SUCCESS: Successfully imported extract_pdf_highlights")
except ImportError as e:
    print(f"ERROR: Failed to import: {e}")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: Unexpected error: {e}")
    sys.exit(1)

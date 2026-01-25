
import requests
import json
import os

def check_headers():
    # We need to create a template first to have a valid path...
    # Or we can just use a fake path if we mock the generator?
    # No, let's use the integration test logic but just check headers.
    
    # Actually, we can just hit the generate endpoint if we know a valid template path
    # Finding a valid template path from the file system
    import glob
    docx_files = glob.glob("backend/app/templates/*.docx")
    if not docx_files:
        print("No templates found")
        return

    template_path = docx_files[0] # Use absolute path or relative
    # The API expects the path as stored in DB or on disk. 
    # Let's assume absolute path works or relative to backend root.
    
    # We need to match how the app sees it.
    # But wait, looking at the code, it takes `template_path`.
    
    url = "http://127.0.0.1:8000/api/templates/generate"
    payload = {
        "template_path": os.path.abspath(template_path),
        "field_values": {"test": "val"},
        "output_format": "pdf"
    }
    
    print(f"Sending request to {url} with format=pdf...")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print("Headers:")
        for k, v in response.headers.items():
            print(f"  {k}: {v}")
            
        if response.headers.get("Content-Type") == "application/pdf":
            print("\nSUCCESS: Content-Type is application/pdf")
        else:
            print(f"\nFAILURE: Content-Type is {response.headers.get('Content-Type')}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_headers()

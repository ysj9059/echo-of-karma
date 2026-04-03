import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def read_docx(file_path):
    doc = zipfile.ZipFile(file_path)
    root = ET.fromstring(doc.read('word/document.xml'))
    text = '\n'.join([node.text for node in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if node.text])
    return text

if __name__ == '__main__':
    for f in sys.argv[1:]:
        out_name = f + '.txt'
        with open(out_name, 'w', encoding='utf-8') as out:
            out.write(read_docx(f))
        print(f"Wrote {out_name}")

import os
import sys
import zipfile
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding='utf-8')

def get_docx_info(file_path):
    try:
        with zipfile.ZipFile(file_path) as z:
            xml_content = z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Find all paragraphs
            paragraphs = []
            for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                p_texts = [n.text for n in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if n.text]
                if p_texts:
                    paragraphs.append(''.join(p_texts).strip())
            
            clean_paras = [p for p in paragraphs if p]
            full_text = ' '.join(clean_paras)
            images = [f for f in z.namelist() if f.startswith('word/media/')]
            
            return {
                'file_name': os.path.basename(file_path),
                'file_size_kb': round(os.path.getsize(file_path) / 1024, 1),
                'word_count': len(full_text.split()),
                'para_count': len(clean_paras),
                'image_count': len(images),
                'paragraphs': clean_paras
            }
    except Exception as e:
        return {'file_name': os.path.basename(file_path), 'error': str(e)}

def analyze_folder(folder_path, name):
    print(f"\n{'='*70}")
    print(f"  PHÂN TÍCH THƯ MỤC: {name} ({folder_path})")
    print(f"{'='*70}")
    
    files = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.endswith('.docx')]
    files.sort()
    
    for f in files:
        info = get_docx_info(f)
        if 'error' in info:
            print(f"❌ {info['file_name']}: Lỗi {info['error']}")
            continue
            
        print(f"\n📄 TẬP TIN: {info['file_name']}")
        print(f"   • Dung lượng: {info['file_size_kb']} KB | Số từ: {info['word_count']} | Số đoạn: {info['para_count']} | Số hình ảnh: {info['image_count']}")
        print(f"   • Trích đoạn đầu bài:")
        for idx, p in enumerate(info['paragraphs'][:8]):
            truncated = p if len(p) <= 120 else p[:117] + '...'
            print(f"     [{idx+1}] {truncated}")
            
        # Tìm các mẫu keyword hoặc đề bài
        key_paras = []
        for p in info['paragraphs']:
            lower = p.lower()
            if any(k in lower for k in ['đề ', 'part ', 'topic ', 'task ', 'bài ', 'test ', 'chủ đề', 'tranh ', 'bài mẫu', 'key ']):
                if len(p) < 100:
                    key_paras.append(p)
                    
        if key_paras:
            print(f"   • Các tiêu đề/đề mục nhận diện được ({len(key_paras)} mục):")
            for kp in key_paras[:12]:
                print(f"       → {kp}")

if __name__ == '__main__':
    analyze_folder('d:/sontayweb/aptis-elearning/READING', 'READING (KỸ NĂNG ĐỌC)')
    analyze_folder('d:/sontayweb/aptis-elearning/SPEAKING', 'SPEAKING (KỸ NĂNG NÓI)')

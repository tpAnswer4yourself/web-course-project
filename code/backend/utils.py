import os
import uuid
from fastapi import UploadFile

UPLOAD_DIR = "uploads"

def save_upload_file(upload_file: UploadFile) -> str:
    """Сохранение изображения"""
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
    file_extension = os.path.splitext(upload_file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(upload_file.file.read())
        
    return f"/uploads/{unique_filename}"


def delete_uploaded_file(file_url: str):
    """Удаление изображения"""
    if not file_url:
        return
        
    local_path = file_url.lstrip("/")
    if os.path.exists(local_path):
        try:
            os.remove(local_path)
        except Exception as e:
            print(f"Ошибка при удалении изображения {local_path}: {e}")
import os
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

from backend.app.core.config import get_settings


def ensure_upload_dir() -> Path:
    path = Path(get_settings().upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_upload(file: UploadFile) -> tuple[str, str, int]:
    upload_dir = ensure_upload_dir()
    suffix = Path(file.filename or "upload").suffix
    stored = f"{uuid.uuid4().hex}{suffix}"
    target = upload_dir / stored
    size = 0
    with target.open("wb") as out:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            out.write(chunk)
    return stored, str(target), size


def remove_file(path: str | None) -> None:
    if path and os.path.exists(path):
        os.remove(path)

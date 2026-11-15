#!/usr/bin/env python3
"""Prépare le site statique pour public_html, sans dépendance externe."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'livraison' / 'global-solutions-lws.zip'
FILES = ['.htaccess', 'robots.txt', 'sitemap.xml']
FOLDERS = ['assets', 'css', 'js']


def package():
    files = sorted(ROOT.glob('*.html'))
    files += [ROOT / name for name in FILES]
    for folder in FOLDERS:
        files += sorted(p for p in (ROOT / folder).rglob('*') if p.is_file())
    for file in files:
        if not file.is_file() or file.is_symlink():
            raise ValueError(f'Fichier absent ou lien non autorisé : {file}')
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUTPUT, 'w', compression=ZIP_DEFLATED) as archive:
        for file in files:
            archive.write(file, file.relative_to(ROOT).as_posix())
    with ZipFile(OUTPUT) as archive:
        assert archive.testzip() is None
        assert 'index.html' in archive.namelist()
        assert '.htaccess' in archive.namelist()
    print(f'{OUTPUT.relative_to(ROOT)} : {len(files)} fichiers, {OUTPUT.stat().st_size:,} octets')


if __name__ == '__main__':
    package()

from PyInstaller.utils.hooks import collect_submodules

block_cipher = None

extension_modules = collect_submodules('app.extensions')
runtime_hidden_imports = [
    'fastapi',
    'uvicorn',
    'pydantic',
    'httpx',
    'bs4',
    'soupsieve',
    'lxml',
    'sqlmodel',
    'sqlalchemy',
    'alembic',
    'apscheduler',
]

a = Analysis(
    ['app/main.py'],
    pathex=[],
    binaries=[],
    datas=[('app/extensions', 'app/extensions')],
    hiddenimports=runtime_hidden_imports + extension_modules,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='pyyomi-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
)

param()

$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$backendDir = Join-Path $repoRoot 'backend'

$pythonPath = if (Test-Path (Join-Path $backendDir 'venv\Scripts\python.exe')) {
  Join-Path $backendDir 'venv\Scripts\python.exe'
} elseif (Test-Path (Join-Path $backendDir '.venv\Scripts\python.exe')) {
  Join-Path $backendDir '.venv\Scripts\python.exe'
} else {
  'python'
}

Write-Host "Using Python: $pythonPath"

Push-Location $backendDir
try {
  & $pythonPath -m pip install --upgrade pip
  & $pythonPath -m pip install -r requirements.txt
  & $pythonPath -m pip install pyinstaller
  & $pythonPath -m PyInstaller pyinstaller.spec --clean
} finally {
  Pop-Location
}

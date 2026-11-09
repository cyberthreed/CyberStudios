$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$python = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) {
    throw 'Create the project environment first: python -m venv .venv; .venv\Scripts\python -m pip install -r requirements.txt'
}

& $python -c 'import cv2, numpy, PIL' 2>$null
if ($LASTEXITCODE -ne 0) {
    throw 'Install dependencies with: python -m pip install -r requirements.txt'
}

& $python ascii_art.py --input reference.jpg --all
if ($LASTEXITCODE -ne 0) {
    throw 'ASCII conversion failed; see the error above.'
}

& $python main.py
exit $LASTEXITCODE

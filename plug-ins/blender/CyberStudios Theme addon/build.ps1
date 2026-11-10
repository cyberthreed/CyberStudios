$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$src = Join-Path $PSScriptRoot "cyberstudios_theme_switcher"
$out = Join-Path $PSScriptRoot "cyberstudios_theme_switcher-1.0.0.zip"
if (Test-Path $out) { Remove-Item $out }
$zip = [IO.Compression.ZipFile]::Open($out, "Create")
try {
    foreach ($f in Get-ChildItem $src -Recurse -File | Where-Object { $_.FullName -notmatch "__pycache__" }) {
        $entry = $f.FullName.Substring($src.Length + 1).Replace("\", "/")
        [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $f.FullName, $entry) | Out-Null
    }
} finally { $zip.Dispose() }
Write-Host "Wrote $out"

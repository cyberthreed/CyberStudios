$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$themeRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$themeCatalog = Get-Content -LiteralPath (Join-Path $themeRoot 'themes.catalog.json') -Raw | ConvertFrom-Json
$releaseDir = Join-Path $themeRoot 'releases'
[System.IO.Directory]::CreateDirectory($releaseDir) | Out-Null
$sourceZipPath = Join-Path $releaseDir 'CyberStudios-Themes-1.0.0.zip'
$installerZipPath = Join-Path $releaseDir 'CyberStudios-Themes-Installers-1.0.0.zip'

function Add-ArchiveFile($archive, $filePath, $entryName) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $filePath, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}

$sourceStream = [System.IO.File]::Open($sourceZipPath, [System.IO.FileMode]::Create)
$installStream = [System.IO.File]::Open($installerZipPath, [System.IO.FileMode]::Create)
$sourceZip = [System.IO.Compression.ZipArchive]::new($sourceStream, [System.IO.Compression.ZipArchiveMode]::Create)
$installZip = [System.IO.Compression.ZipArchive]::new($installStream, [System.IO.Compression.ZipArchiveMode]::Create)
$packageReport = @()
try {
    foreach ($theme in $themeCatalog) {
        $folderPath = Join-Path $themeRoot $theme.folder
        foreach ($file in (Get-ChildItem -LiteralPath $folderPath -File -Recurse -Force)) {
            $entryName = [System.IO.Path]::GetRelativePath($themeRoot, $file.FullName).Replace('\', '/')
            Add-ArchiveFile $sourceZip $file.FullName $entryName
        }
        $manifest = Get-Content -LiteralPath (Join-Path $folderPath 'package.json') -Raw | ConvertFrom-Json
        $vsixName = "$($manifest.name)-$($manifest.version).vsix"
        $vsixPath = Join-Path $folderPath "dist\$vsixName"
        Add-ArchiveFile $installZip $vsixPath $vsixName
        $packageZip = [System.IO.Compression.ZipFile]::OpenRead($vsixPath)
        try {
            $names = @($packageZip.Entries | ForEach-Object { $_.FullName })
            if ($names.Count -ne 7) { throw "Unexpected file count in $vsixName" }
            if ($names | Where-Object { $_ -match '(node_modules|samples|scripts|\.env|\.git/)' }) { throw "Unexpected development files in $vsixName" }
            $reader = [System.IO.StreamReader]::new($packageZip.GetEntry('extension/package.json').Open())
            try { $packagedManifest = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
            if ($packagedManifest.name -ne $manifest.name) { throw "Manifest mismatch in $vsixName" }
            $themeEntry = 'extension/' + $manifest.contributes.themes[0].path.Replace('./','')
            $reader = [System.IO.StreamReader]::new($packageZip.GetEntry($themeEntry).Open())
            try { $packagedTheme = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
            if ($packagedTheme.name -ne $theme.name) { throw "Theme name mismatch in $vsixName" }
            $packageReport += [pscustomobject]@{ Name = $theme.name; Files = $names.Count; Installable = $true; Bytes = (Get-Item -LiteralPath $vsixPath).Length }
        } finally { $packageZip.Dispose() }
    }
    $legacyFolder = Join-Path $themeRoot 'cybercore-cotton-candy'
    if (Test-Path -LiteralPath $legacyFolder -PathType Container) {
        foreach ($file in (Get-ChildItem -LiteralPath $legacyFolder -File -Recurse -Force)) {
            Add-ArchiveFile $sourceZip $file.FullName ([System.IO.Path]::GetRelativePath($themeRoot, $file.FullName).Replace('\','/'))
        }
    }
    $topFiles = @('README.md','VALIDATION.md','LICENSE','package.json','package-lock.json','.gitignore','themes.catalog.json')
    foreach ($file in $topFiles) { Add-ArchiveFile $sourceZip (Join-Path $themeRoot $file) $file }
    foreach ($file in (Get-ChildItem -LiteralPath (Join-Path $themeRoot 'tools') -File -Recurse -Force)) {
        Add-ArchiveFile $sourceZip $file.FullName ([System.IO.Path]::GetRelativePath($themeRoot, $file.FullName).Replace('\','/'))
    }
    foreach ($file in @('contrast.json','syntax.json','vscode-load.json','SHA256SUMS.txt')) {
        Add-ArchiveFile $sourceZip (Join-Path $themeRoot "validation\$file") "validation/$file"
    }
    $installEntry = $installZip.CreateEntry('INSTALL.txt')
    $installWriter = [System.IO.StreamWriter]::new($installEntry.Open())
    try {
        $installWriter.WriteLine("♡ cyberstudios / theme.library ✧`n`ndream in pixels. create without limits.`n`n☁ eight little workspaces, ready for your desktop.`n`n1. Extract this ZIP.`n2. In VS Code, open Extensions.`n3. Open the ... menu and choose Install from VSIX...`n4. Select any .vsix file from this extracted folder.`n5. Open Preferences: Color Theme and choose the installed theme.`n`nRepeat for more themes. You may install all eight and switch between them.`nRequires VS Code 1.100.0 or later.`n`nEach package contains colors only, with no executable extension entry point.`nThe complete collection ZIP contains editable source and individual project READMEs.`nSource: https://github.com/cyberthreed/CyberStudios/tree/main/themes/vscode`nThese themes are not listed on the Visual Studio Marketplace.")
    } finally { $installWriter.Dispose() }
} finally {
    $sourceZip.Dispose(); $installZip.Dispose(); $sourceStream.Dispose(); $installStream.Dispose()
}
$packageReport | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $themeRoot 'validation\packages.json') -Encoding utf8
foreach ($zipPath in @($sourceZipPath, $installerZipPath)) {
    $archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        $installers = @($archive.Entries | Where-Object { $_.FullName -like '*.vsix' })
        if ($installers.Count -ne 8) { throw "Expected all eight installers in $zipPath" }
        [pscustomobject]@{ Bundle = [System.IO.Path]::GetFileName($zipPath); Files = $archive.Entries.Count; Installers = $installers.Count; Bytes = (Get-Item -LiteralPath $zipPath).Length } | ConvertTo-Json -Compress
    } finally { $archive.Dispose() }
}

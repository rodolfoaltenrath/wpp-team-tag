$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distPath = Join-Path $projectRoot "dist"
$releasePath = Join-Path $projectRoot "release"
$packageJsonPath = Join-Path $projectRoot "package.json"

if (-not (Test-Path $distPath)) {
  throw "A pasta 'dist' nao foi encontrada. Rode o build antes de empacotar."
}

$packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
$version = $packageJson.version
$zipFileName = "wpp-team-tag-$version.zip"
$zipPath = Join-Path $releasePath $zipFileName

New-Item -ItemType Directory -Force -Path $releasePath | Out-Null

if (Test-Path $zipPath) {
  Remove-Item -Path $zipPath -Force
}

$distItems = Get-ChildItem -Path $distPath -Force

if ($distItems.Count -eq 0) {
  throw "A pasta 'dist' esta vazia. Rode o build antes de empacotar."
}

$distItems | Compress-Archive -DestinationPath $zipPath -CompressionLevel Optimal

Write-Host "Pacote gerado em: $zipPath"

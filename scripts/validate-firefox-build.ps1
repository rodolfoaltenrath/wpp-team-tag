$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distPath = Join-Path $projectRoot "dist-firefox"
$manifestPath = Join-Path $distPath "manifest.json"

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "Manifesto Firefox nao encontrado em dist-firefox."
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$mainContentScript = $manifest.content_scripts |
  Where-Object { $_.world -eq "MAIN" } |
  Select-Object -First 1
$pageScript = $mainContentScript.js |
  Where-Object { $_ -match "(^|/)page\.js$" } |
  Select-Object -First 1

if (-not $pageScript) {
  throw "O bridge MAIN do Firefox nao foi gerado como page.js autocontido."
}

$pageScriptPath = Join-Path $distPath $pageScript
$pageSource = Get-Content -LiteralPath $pageScriptPath -Raw

if ($pageSource -match "import\(") {
  throw "O bridge MAIN contem import dinamico e seria resolvido pelo dominio do WhatsApp."
}

$runtimeContentScript = $manifest.content_scripts |
  Where-Object {
    $_.world -eq "MAIN" -and
    $_.run_at -eq "document_idle" -and
    ($_.js | Where-Object { $_ -match "(^|/)runtime\.js$" })
  } |
  Select-Object -First 1

if (-not $runtimeContentScript) {
  throw "O runtime MAIN do WA-JS nao foi registrado em document_idle."
}

$runtimeScript = $runtimeContentScript.js |
  Where-Object { $_ -match "(^|/)runtime\.js$" } |
  Select-Object -First 1
$runtimePath = Join-Path $distPath $runtimeScript

if (-not (Test-Path -LiteralPath $runtimePath)) {
  throw "O runtime autocontido do WA-JS nao foi gerado."
}

$runtimeSource = Get-Content -LiteralPath $runtimePath -Raw

if ($runtimeSource -match "import\(") {
  throw "O runtime MAIN contem import dinamico e seria resolvido pelo dominio do WhatsApp."
}

if ($manifest.permissions -contains "scripting" -or $manifest.background) {
  throw "O build Firefox ainda depende de injecao pelo background."
}

Write-Host "Build Firefox validado: bridge e WA-JS sao autocontidos e independem de background."

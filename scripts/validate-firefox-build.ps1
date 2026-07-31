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

$runtimePath = Join-Path $distPath "src/content/runtime.js"

if (-not (Test-Path -LiteralPath $runtimePath)) {
  throw "O runtime autocontido do WA-JS nao foi gerado."
}

$runtimeSource = Get-Content -LiteralPath $runtimePath -Raw

if ($runtimeSource -match "import\(") {
  throw "O runtime MAIN contem import dinamico e seria resolvido pelo dominio do WhatsApp."
}

$duplicatedRuntime = Get-ChildItem -LiteralPath (Join-Path $distPath "assets") |
  Where-Object { $_.Name -match "^runtime\..*\.js$" }

if ($duplicatedRuntime) {
  throw "O build Firefox contem uma copia modular desnecessaria do WA-JS."
}

if (-not ($manifest.permissions -contains "scripting")) {
  throw "A permissao scripting necessaria para a injecao sob demanda nao foi gerada."
}

$backgroundScript = $manifest.background.scripts | Select-Object -First 1

if ($backgroundScript -ne "firefox/background.js") {
  throw "O background classico do Firefox nao foi registrado diretamente."
}

if (Test-Path -LiteralPath (Join-Path $distPath "service-worker-loader.js")) {
  throw "O build Firefox ainda contem o loader intermediario do background."
}

$backgroundPath = Join-Path $distPath $backgroundScript
$backgroundSource = Get-Content -LiteralPath $backgroundPath -Raw

if ($backgroundSource -match "(^|[;\r\n])\s*import[\s({]" -or
    $backgroundSource -notmatch "runtime\.onMessage\.addListener") {
  throw "O listener do background nao esta registrado de forma sincrona."
}

$eagerRuntime = $manifest.content_scripts |
  Where-Object { $_.js | Where-Object { $_ -match "(^|/)runtime\.js$" } }

if ($eagerRuntime) {
  throw "O WA-JS nao pode ser carregado antecipadamente como content script."
}

Write-Host "Build Firefox validado: WA-JS autocontido com injecao sob demanda e listener sincrono."

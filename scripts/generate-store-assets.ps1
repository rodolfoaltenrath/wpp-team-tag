$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $diameter = $Radius * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Save-Icon {
  param(
    [string]$Path,
    [int]$Size
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $backgroundPath = New-RoundedRectanglePath 0 0 ($Size - 1) ($Size - 1) ([Math]::Max([Math]::Round($Size * 0.2), 3))
  $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(0, 0, $Size, $Size)),
    ([System.Drawing.Color]::FromArgb(20, 88, 60)),
    ([System.Drawing.Color]::FromArgb(11, 61, 40)),
    45
  )
  $graphics.FillPath($backgroundBrush, $backgroundPath)

  $bubbleX = [Math]::Round($Size * 0.18)
  $bubbleY = [Math]::Round($Size * 0.2)
  $bubbleWidth = [Math]::Round($Size * 0.64)
  $bubbleHeight = [Math]::Round($Size * 0.5)
  $bubbleRadius = [Math]::Max([Math]::Round($Size * 0.1), 2)

  $bubblePath = New-RoundedRectanglePath $bubbleX $bubbleY $bubbleWidth $bubbleHeight $bubbleRadius
  $bubbleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $graphics.FillPath($bubbleBrush, $bubblePath)

  $tail = New-Object System.Drawing.Drawing2D.GraphicsPath
  $tail.AddPolygon(@(
    (New-Object System.Drawing.Point([Math]::Round($Size * 0.34), [Math]::Round($Size * 0.66))),
    (New-Object System.Drawing.Point([Math]::Round($Size * 0.28), [Math]::Round($Size * 0.82))),
    (New-Object System.Drawing.Point([Math]::Round($Size * 0.46), [Math]::Round($Size * 0.7)))
  ))
  $graphics.FillPath($bubbleBrush, $tail)

  $fontSize = [Math]::Max([Math]::Round($Size * 0.18), 6)
  $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 88, 60))
  $stringFormat = New-Object System.Drawing.StringFormat
  $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
  $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textHeight = [single]($bubbleHeight - [Math]::Round($Size * 0.04))
  $textRectangle = New-Object System.Drawing.RectangleF([single]$bubbleX, [single]$bubbleY, [single]$bubbleWidth, $textHeight)
  $graphics.DrawString("TT", $font, $textBrush, $textRectangle, $stringFormat)

  $directory = Split-Path -Path $Path -Parent
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $stringFormat.Dispose()
  $textBrush.Dispose()
  $font.Dispose()
  $tail.Dispose()
  $bubbleBrush.Dispose()
  $bubblePath.Dispose()
  $backgroundBrush.Dispose()
  $backgroundPath.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Save-SmallPromoTile {
  param(
    [string]$Path
  )

  $width = 440
  $height = 280

  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $backgroundBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(0, 0, $width, $height)),
    ([System.Drawing.Color]::FromArgb(234, 248, 239)),
    ([System.Drawing.Color]::FromArgb(213, 237, 224)),
    45
  )
  $graphics.FillRectangle($backgroundBrush, 0, 0, $width, $height)

  $panelPath = New-RoundedRectanglePath 20 20 400 240 26
  $panelBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle(20, 20, 400, 240)),
    ([System.Drawing.Color]::FromArgb(20, 88, 60)),
    ([System.Drawing.Color]::FromArgb(11, 61, 40)),
    35
  )
  $graphics.FillPath($panelBrush, $panelPath)

  $iconPath = Join-Path ([System.IO.Path]::GetTempPath()) "wpp-team-tag-store-icon.png"
  Save-Icon -Path $iconPath -Size 128
  $iconImage = [System.Drawing.Image]::FromFile($iconPath)
  $graphics.DrawImage($iconImage, 38, 58, 96, 96)

  $titleFont = New-Object System.Drawing.Font("Segoe UI", 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $subtitleFont = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(182, 231, 205))

  $graphics.DrawString("WPP Team Tag", $titleFont, $textBrush, 150, 72)
  $graphics.DrawString("Prefixe mensagens do WhatsApp Web", $subtitleFont, $accentBrush, 150, 122)
  $graphics.DrawString("com o nome do atendente.", $subtitleFont, $accentBrush, 150, 146)

  $tagPath = New-RoundedRectanglePath 150 190 178 42 14
  $tagBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255))
  $tagTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 88, 60))
  $tagFont = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.FillPath($tagBrush, $tagPath)
  $graphics.DrawString("*Ana:*  Ola, tudo bem?", $tagFont, $tagTextBrush, 164, 202)

  $directory = Split-Path -Path $Path -Parent
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $iconImage.Dispose()
  Remove-Item -Path $iconPath -Force
  $tagFont.Dispose()
  $tagTextBrush.Dispose()
  $tagBrush.Dispose()
  $tagPath.Dispose()
  $accentBrush.Dispose()
  $textBrush.Dispose()
  $subtitleFont.Dispose()
  $titleFont.Dispose()
  $panelBrush.Dispose()
  $panelPath.Dispose()
  $backgroundBrush.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$iconsPath = Join-Path $projectRoot "public\icons"
$storeAssetsPath = Join-Path $projectRoot "store-assets\chrome-web-store"

Save-Icon -Path (Join-Path $iconsPath "icon16.png") -Size 16
Save-Icon -Path (Join-Path $iconsPath "icon32.png") -Size 32
Save-Icon -Path (Join-Path $iconsPath "icon48.png") -Size 48
Save-Icon -Path (Join-Path $iconsPath "icon128.png") -Size 128
Save-SmallPromoTile -Path (Join-Path $storeAssetsPath "small-promo-tile.png")

Write-Host "Assets gerados em: $iconsPath"
Write-Host "Promo tile gerado em: $storeAssetsPath"

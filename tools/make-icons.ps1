# アプリのアイコン画像（PNG）を icons/ に作る
# 使い方：powershell -ExecutionPolicy Bypass -File tools/make-icons.ps1
# デザイン：青地の上に白い書類（右上が折れた紙）、その上に青い「PDF」の文字
Add-Type -AssemblyName System.Drawing

$blue = [System.Drawing.ColorTranslator]::FromHtml('#2357c6')
$outDir = Join-Path $PSScriptRoot '..\icons'
New-Item -ItemType Directory -Force $outDir | Out-Null

# size: 画像の一辺（px）、scale: 書類の高さが画像の何割か（maskable は切り抜かれても欠けないよう小さめ）
function New-Icon([int]$size, [double]$scale, [string]$name) {
  $bitmap = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bitmap)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear($blue)

  # 書類（縦長の紙。右上の角を折る）
  $h = $size * $scale
  $w = $h * 0.78
  $x = ($size - $w) / 2
  $y = ($size - $h) / 2
  $fold = $w * 0.28
  $page = New-Object System.Drawing.Drawing2D.GraphicsPath
  $page.AddPolygon(@(
      (New-Object System.Drawing.PointF $x, $y),
      (New-Object System.Drawing.PointF ($x + $w - $fold), $y),
      (New-Object System.Drawing.PointF ($x + $w), ($y + $fold)),
      (New-Object System.Drawing.PointF ($x + $w), ($y + $h)),
      (New-Object System.Drawing.PointF $x, ($y + $h))
    ))
  $g.FillPath([System.Drawing.Brushes]::White, $page)
  # 折り返し部分（少し暗い白）
  $foldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#c9d6f2'))
  $g.FillPolygon($foldBrush, @(
      (New-Object System.Drawing.PointF ($x + $w - $fold), $y),
      (New-Object System.Drawing.PointF ($x + $w - $fold), ($y + $fold)),
      (New-Object System.Drawing.PointF ($x + $w), ($y + $fold))
    ))

  # 「PDF」の文字（書類の下寄りに、横幅いっぱい）
  $font = New-Object System.Drawing.Font 'Segoe UI', ($w * 0.30), ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textArea = New-Object System.Drawing.RectangleF $x, ($y + $h * 0.45), $w, ($h * 0.40)
  $g.DrawString('PDF', $font, (New-Object System.Drawing.SolidBrush $blue), $textArea, $format)

  $path = Join-Path $outDir $name
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bitmap.Dispose()
  Write-Output "作成: icons/$name（${size}x${size}）"
}

New-Icon 192 0.70 'icon-192.png'
New-Icon 512 0.70 'icon-512.png'
New-Icon 512 0.56 'icon-maskable-512.png'
New-Icon 180 0.66 'apple-touch-icon.png'

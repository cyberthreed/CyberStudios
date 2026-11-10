param([string]$CollectionRoot = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$catalog = Get-Content -LiteralPath (Join-Path $CollectionRoot 'palettes.json') -Raw | ConvertFrom-Json
function ColorOf([string]$hex) { return [System.Drawing.ColorTranslator]::FromHtml($hex.Substring(0,7)) }
function Fill($canvas,[string]$hex,[single]$x,[single]$y,[single]$w,[single]$h) { $brush=[System.Drawing.SolidBrush]::new((ColorOf $hex));try{$canvas.FillRectangle($brush,$x,$y,$w,$h)}finally{$brush.Dispose()} }
function TextAt($canvas,[string]$text,[single]$x,[single]$y,[single]$size,[string]$hex,[bool]$bold=$false) {
 $style=if($bold){[System.Drawing.FontStyle]::Bold}else{[System.Drawing.FontStyle]::Regular}
 $font=[System.Drawing.Font]::new('Segoe UI',$size,$style,[System.Drawing.GraphicsUnit]::Pixel)
 $brush=[System.Drawing.SolidBrush]::new((ColorOf $hex));try{$canvas.DrawString($text,$font,$brush,$x,$y)}finally{$brush.Dispose();$font.Dispose()}
}
function Line($canvas,[string]$hex,[single]$x1,[single]$y1,[single]$x2,[single]$y2,[single]$width=1,[int]$alpha=255) {
 $color=ColorOf $hex;$pen=[System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb($alpha,$color),$width);try{$canvas.DrawLine($pen,$x1,$y1,$x2,$y2)}finally{$pen.Dispose()}
}
function Poly($canvas,[string]$fill,[string]$stroke,[System.Drawing.PointF[]]$points) {
 $brush=[System.Drawing.SolidBrush]::new((ColorOf $fill));$pen=[System.Drawing.Pen]::new((ColorOf $stroke),2.5);try{$canvas.FillPolygon($brush,$points);$canvas.DrawPolygon($pen,$points)}finally{$brush.Dispose();$pen.Dispose()}
}
foreach($theme in $catalog.themes) {
 $bitmap=[System.Drawing.Bitmap]::new(1200,800)
 $canvas=[System.Drawing.Graphics]::FromImage($bitmap)
 $canvas.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
 $canvas.TextRenderingHint=[System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
 try {
  $canvas.Clear((ColorOf $theme.paper))
  TextAt $canvas 'CYBERSTUDIOS / BLENDER COLLECTION' 34 22 12 $theme.muted $true
  TextAt $canvas $theme.name 31 43 36 $theme.ink $true
  TextAt $canvas ($theme.family.ToUpper()+' COLLECTION / '+$theme.mode.ToUpper()) 850 56 12 $theme.muted $true
  TextAt $canvas $theme.description 34 95 13 $theme.muted
  Fill $canvas $theme.header 28 130 1144 33
  TextAt $canvas 'File    Edit    Render    Window    Help' 43 139 12 $theme.ink
  TextAt $canvas 'Layout       Modeling       Shading       Scripting' 725 139 12 $theme.ink
  Fill $canvas $theme.header 28 164 858 33
  TextAt $canvas 'Object Mode       View     Select     Add     Object' 44 174 11 $theme.ink
  Fill $canvas $theme.paper 28 198 858 330
  for($i=-12;$i -le 18;$i++){Line $canvas $theme.grid (40+$i*47) 205 (550+$i*47) 520 1 95;Line $canvas $theme.grid (275+$i*47) 205 (-235+$i*47) 520 1 95}
  Fill $canvas $theme.paper 28 198 858 18
  TextAt $canvas 'User Perspective' 66 221 12 $theme.ink
  TextAt $canvas '(1) Collection | Cube' 66 239 10 $theme.muted
  foreach($position in @(220,257,294,331)){Fill $canvas $theme.panel 38 $position 23 25}
  TextAt $canvas '+' 43 258 17 $theme.accent $true
  Line $canvas '#AD3D50' 43 365 881 510 1 115
  Line $canvas '#28735A' 105 510 872 325 1 115
  Poly $canvas '#C7C7CE' $theme.accent @([System.Drawing.PointF]::new(362,315),[System.Drawing.PointF]::new(460,276),[System.Drawing.PointF]::new(559,315),[System.Drawing.PointF]::new(460,355))
  Poly $canvas '#9799A3' $theme.accent @([System.Drawing.PointF]::new(362,315),[System.Drawing.PointF]::new(460,355),[System.Drawing.PointF]::new(460,462),[System.Drawing.PointF]::new(362,420))
  Poly $canvas '#B0B2BA' $theme.accent @([System.Drawing.PointF]::new(460,355),[System.Drawing.PointF]::new(559,315),[System.Drawing.PointF]::new(559,420),[System.Drawing.PointF]::new(460,462))
  TextAt $canvas 'Z' 823 221 12 '#5D90BD' $true
  TextAt $canvas 'Y' 803 244 12 '#4A9774' $true
  TextAt $canvas 'X' 844 244 12 '#BA5865' $true
  Fill $canvas $theme.panel 887 164 285 364
  Fill $canvas $theme.header 887 164 285 33
  TextAt $canvas 'Scene Collection' 903 174 12 $theme.ink $true
  TextAt $canvas 'v  Collection' 908 211 12 $theme.ink
  TextAt $canvas '    Camera' 919 235 12 $theme.muted
  Fill $canvas $theme.selection 887 257 285 25
  TextAt $canvas '    Cube' 919 261 12 $theme.ink $true
  TextAt $canvas '    Light' 919 287 12 $theme.muted
  Fill $canvas $theme.header 887 319 285 29
  TextAt $canvas 'Transform' 903 327 12 $theme.ink $true
  TextAt $canvas 'Location' 901 365 11 $theme.muted
  TextAt $canvas 'Rotation' 901 422 11 $theme.muted
  foreach($row in @(358,382,406,430,454,478)){Fill $canvas $theme.field 971 $row 182 21; TextAt $canvas $(if($row -lt 420){'0.000 m'}else{'0.000 degrees'}) 1059 ($row+2) 10 $theme.ink}
  Fill $canvas $theme.header 28 529 1144 30
  TextAt $canvas 'Shader Editor     View     Select     Add     Node' 44 537 11 $theme.ink
  Fill $canvas $theme.paper 28 560 1144 105
  [xml]$xml=Get-Content -LiteralPath (Join-Path (Join-Path $CollectionRoot $theme.folder) ($theme.name.Replace(' ','_')+'.xml')) -Raw
  $nodes=$xml.bpy.Theme.node_editor.ThemeNodeEditor
  $headerColors=@($nodes.input_node,$nodes.shader_node,$nodes.output_node)
  Line $canvas $theme.border 255 611 374 605 3
  Line $canvas $theme.border 614 611 740 605 3
  $i=0
  foreach($name in @('Color','Principled BSDF','Material Output')){
   $x=104+$i*360
   Fill $canvas $theme.field $x 578 220 70
   Fill $canvas $headerColors[$i] $x 578 220 25
   TextAt $canvas $name ($x+10) 584 11 $theme.ink $true
   TextAt $canvas $(if($i -eq 1){'Roughness                     0.500'}else{'Color / Surface'}) ($x+10) 618 10 $theme.ink
   $i++
  }
  Fill $canvas $theme.timeline 28 666 1144 46
  TextAt $canvas 'Timeline' 42 675 11 $theme.ink
  for($i=0;$i -le 8;$i++){TextAt $canvas ([string]($i*20)) (235+$i*100) 675 10 $theme.muted}
  Line $canvas $theme.accent 462 666 462 711 2
  TextAt $canvas 'dream in pixels. create without limits.' 34 738 13 $theme.ink $true
  TextAt $canvas 'Illustrated palette preview / UI colors only' 850 739 11 $theme.muted
  $bitmap.Save((Join-Path (Join-Path $CollectionRoot $theme.folder) 'preview.png'),[System.Drawing.Imaging.ImageFormat]::Png)
 } finally {$canvas.Dispose();$bitmap.Dispose()}
}
$sheet=[System.Drawing.Bitmap]::new(1800,([int][Math]::Ceiling($catalog.themes.Count/3)*400))
$sheetCanvas=[System.Drawing.Graphics]::FromImage($sheet)
$sheetCanvas.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
try{
 $i=0
 foreach($theme in $catalog.themes){$image=[System.Drawing.Image]::FromFile((Join-Path (Join-Path $CollectionRoot $theme.folder) 'preview.png'));try{$sheetCanvas.DrawImage($image,([int]($i%3)*600),([int][Math]::Floor($i/3)*400),600,400)}finally{$image.Dispose()};$i++}
 $sheet.Save((Join-Path $CollectionRoot 'preview-collection.png'),[System.Drawing.Imaging.ImageFormat]::Png)
}finally{$sheetCanvas.Dispose();$sheet.Dispose()}
Write-Output ('Rendered '+$catalog.themes.Count+' palette previews and the collection sheet.')

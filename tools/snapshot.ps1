#Requires -Version 5.1
<#
  给整个站点打一个带时间戳的快照，存进 版本存档/。
  用法：
    powershell -ExecutionPolicy Bypass -File tools\snapshot.ps1
    powershell -ExecutionPolicy Bypass -File tools\snapshot.ps1 -Label "改版前"
  也可以直接双击项目根目录的 备份.cmd。
#>
param(
  [string]$Label = ""
)

$ErrorActionPreference = "Stop"

$root  = Split-Path -Parent $PSScriptRoot
$store = Join-Path $root "版本存档"
New-Item -ItemType Directory -Force -Path $store | Out-Null

$stamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$safe  = ($Label -replace '[\\/:*?"<>|\s]+', "-").Trim("-")
$name  = if ($safe) { "$stamp`_$safe.zip" } else { "$stamp.zip" }
$zip   = Join-Path $store $name

# 只备份站点内容；版本存档本身、预览截图不进去
$items = @(
  "index.html", "blog.html", "post.html",
  "assets", "README.md", "AGENTS.md", "CHANGELOG.md"
) | Where-Object { Test-Path (Join-Path $root $_) }

if (-not $items) { throw "没找到要备份的文件，确认脚本在项目的 tools/ 目录里。" }

$tmp = Join-Path $env:TEMP ("site-snapshot-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tmp | Out-Null

try {
  foreach ($item in $items) {
    Copy-Item -Path (Join-Path $root $item) -Destination $tmp -Recurse -Force
  }
  Compress-Archive -Path (Join-Path $tmp "*") -DestinationPath $zip -CompressionLevel Optimal
}
finally {
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

$kb    = [math]::Round((Get-Item $zip).Length / 1KB)
$count = (Get-ChildItem $store -Filter *.zip).Count

Write-Host ""
Write-Host "已保存快照：$name" -ForegroundColor Green
Write-Host "大小：$kb KB"
Write-Host "位置：$store"
Write-Host "当前共有 $count 个快照。"
Write-Host ""

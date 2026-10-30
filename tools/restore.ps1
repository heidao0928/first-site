#Requires -Version 5.1
<#
  从 版本存档/ 里挑一个快照恢复，恢复前会先把当前状态另存一份。
  用法：双击项目根目录的 恢复.cmd，或在终端里：
    powershell -ExecutionPolicy Bypass -File tools\restore.ps1
#>
$ErrorActionPreference = "Stop"

$root  = Split-Path -Parent $PSScriptRoot
$store = Join-Path $root "版本存档"

$snaps = @(Get-ChildItem $store -Filter *.zip -ErrorAction SilentlyContinue | Sort-Object Name -Descending)
if ($snaps.Count -eq 0) {
  Write-Host "版本存档里还没有快照，先运行 备份.cmd。" -ForegroundColor Yellow
  return
}

Write-Host ""
Write-Host "可用快照（新的在上面）：" -ForegroundColor Cyan
for ($i = 0; $i -lt $snaps.Count; $i++) {
  $size = [math]::Round($snaps[$i].Length / 1KB)
  Write-Host ("  {0,2}. {1}  ({2} KB)" -f ($i + 1), $snaps[$i].Name, $size)
}
Write-Host ""

$choice = Read-Host "输入要恢复的编号（直接回车取消）"
if ([string]::IsNullOrWhiteSpace($choice)) { Write-Host "已取消。"; return }

$index = 0
if (-not [int]::TryParse($choice.Trim(), [ref]$index) -or $index -lt 1 -or $index -gt $snaps.Count) {
  Write-Host "编号不对，已取消。" -ForegroundColor Yellow
  return
}

$target = $snaps[$index - 1]
Write-Host ""
Write-Host "即将恢复到：$($target.Name)" -ForegroundColor Yellow
$confirm = Read-Host "当前内容会先备份到 _恢复前_* 目录。确认恢复请输入 y"
if ($confirm -notmatch '^[Yy]$') { Write-Host "已取消。"; return }

# 先把当前站点内容挪走，保证恢复出来的是干净的旧版本
$stamp  = Get-Date -Format "yyyy-MM-dd_HHmmss"
$safety = Join-Path $root "_恢复前_$stamp"
New-Item -ItemType Directory -Path $safety -Force | Out-Null

$current = @("index.html", "blog.html", "post.html", "assets", "README.md", "AGENTS.md", "CHANGELOG.md")
foreach ($item in $current) {
  $path = Join-Path $root $item
  if (Test-Path $path) {
    Move-Item -Path $path -Destination $safety -Force
  }
}

Expand-Archive -Path $target.FullName -DestinationPath $root -Force

Write-Host ""
Write-Host "已恢复到：$($target.Name)" -ForegroundColor Green
Write-Host "恢复前的文件保存在：$safety"
Write-Host "确认没问题后，可以手动删掉这个 _恢复前_ 目录。"
Write-Host ""

#Requires -Version 5.1
<#
  把本地改动提交并推送到 GitHub（heidao0928/first-site）。
  用法：双击项目根目录的 推送.cmd，或：
    powershell -ExecutionPolicy Bypass -File tools\push.ps1 -Message "这次改了什么"

  说明：
  - 工作区有改动 → 先提交再推送；
  - 工作区没改动但本地领先远端 → 直接推送（比如在管理页提交过、本地 rebase 过）；
  - 推送被拒（远端有新提交）→ 自动 pull --rebase 后重试一次。
#>
param(
  [string]$Message = ""
)

$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) { $git = "D:\tools\git\cmd\git.exe" }
if (-not (Test-Path $git)) {
  Write-Host "找不到 git。请确认 D:\tools\git 还在，或被移动过。" -ForegroundColor Red
  return
}

& $git add -A
$staged = @(& $git diff --cached --name-only)

if ($staged.Count -gt 0) {
  if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "更新：" + (Get-Date -Format "yyyy-MM-dd HH:mm")
  }

  Write-Host "本次改动：" -ForegroundColor Cyan
  $staged | ForEach-Object { Write-Host "  - $_" }

  & $git commit -q -m $Message
  if ($LASTEXITCODE -ne 0) { Write-Host "提交失败。" -ForegroundColor Red; return }
} else {
  Write-Host "工作区没有新改动。" -ForegroundColor Yellow
}

Write-Host "正在推送到 GitHub…" -ForegroundColor Cyan
$pushOutput = & $git push origin main 2>&1
$pushCode = $LASTEXITCODE

if ($pushCode -ne 0) {
  $joined = ($pushOutput | Out-String)
  if ($joined -match "fetch first|non-fast-forward|rejected") {
    Write-Host "远端有你在网页上做的提交，先合并再推…" -ForegroundColor Yellow
    & $git pull --rebase origin main
    if ($LASTEXITCODE -ne 0) {
      Write-Host "自动合并失败，可能有冲突，需要手动处理。" -ForegroundColor Red
      $pushOutput | ForEach-Object { Write-Host $_ }
      return
    }
    $pushOutput = & $git push origin main 2>&1
    $pushCode = $LASTEXITCODE
  }
}

if ($pushCode -ne 0) {
  Write-Host "推送失败：检查网络，或 GitHub 上的 SSH 公钥是否还在。" -ForegroundColor Red
  $pushOutput | ForEach-Object { Write-Host $_ }
  return
}

Write-Host ""
Write-Host "已同步到 GitHub：https://github.com/heidao0928/first-site" -ForegroundColor Green
Write-Host "线上地址：https://heidao0928.github.io/first-site/" -ForegroundColor Green
Write-Host ""

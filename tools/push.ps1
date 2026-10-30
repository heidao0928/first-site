#Requires -Version 5.1
<#
  把本地改动提交并推送到 GitHub（heidao0928/first-site）。
  用法：双击项目根目录的 推送.cmd，或：
    powershell -ExecutionPolicy Bypass -File tools\push.ps1 -Message "这次改了什么"
#>
param(
  [string]$Message = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) { $git = "D:\tools\git\cmd\git.exe" }
if (-not (Test-Path $git)) {
  Write-Host "找不到 git。请确认 D:\tools\git 还在，或被移动过。" -ForegroundColor Red
  return
}

# 有改动才提交
& $git add -A
$staged = @(& $git diff --cached --name-only)
if ($staged.Count -eq 0) {
  Write-Host "没有需要提交的改动。" -ForegroundColor Yellow
  return
}

if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = "更新：" + (Get-Date -Format "yyyy-MM-dd HH:mm")
}

Write-Host "本次改动：" -ForegroundColor Cyan
$staged | ForEach-Object { Write-Host "  - $_" }

& $git commit -q -m $Message
if ($LASTEXITCODE -ne 0) { Write-Host "提交失败。" -ForegroundColor Red; return }

& $git push origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "推送失败：检查网络，或 GitHub 上的 SSH 公钥是否还在。" -ForegroundColor Red
  return
}

Write-Host ""
Write-Host "已同步到 GitHub：https://github.com/heidao0928/first-site" -ForegroundColor Green
Write-Host ""

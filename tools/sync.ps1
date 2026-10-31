#Requires -Version 5.1
<#
  把 GitHub 上的最新提交拉到本地（比如你在管理页保存过、或在网页上改过文件）。
  用法：双击项目根目录的 同步.cmd
    powershell -ExecutionPolicy Bypass -File tools\sync.ps1
#>
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) { $git = "D:\tools\git\cmd\git.exe" }

Write-Host "正在从 GitHub 拉取…" -ForegroundColor Cyan
& $git pull --rebase origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "拉取失败：可能是本地有未提交的改动，或网络问题。" -ForegroundColor Red
  Write-Host "先双击 推送.cmd 把本地改动提交掉，再回来同步。" -ForegroundColor Yellow
  Read-Host "按回车关闭"
  return
}

$local = (& $git rev-parse HEAD).Trim()
Write-Host ""
Write-Host "本地已同步到：$($local.Substring(0,7))" -ForegroundColor Green
& $git log --oneline -3
Write-Host ""
Write-Host "本地预览：双击 index.html" -ForegroundColor Green
Read-Host "按回车关闭"

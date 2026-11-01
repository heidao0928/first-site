#Requires -Version 5.1
<#
  把 GitHub 上的最新提交拉到本地（比如你在后台保存过、或在网页上改过文件）。
  用法：双击项目根目录的 同步.cmd
    powershell -ExecutionPolicy Bypass -File tools\sync.ps1

  本地有没提交的改动时会先自动 stash，拉完再放回去。
#>
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) { $git = "D:\tools\git\cmd\git.exe" }

$before = (& $git rev-parse HEAD 2>$null).Trim()

# 本地有改动就先收起来，免得 pull 直接失败
$dirty = (@(& $git status --porcelain) -join "`n")
$stashed = $false
if ($dirty.Trim()) {
  Write-Host "检测到本地未提交的改动，先临时收起来…" -ForegroundColor Yellow
  & $git stash push -u -m "sync-auto" | Out-Null
  if ($LASTEXITCODE -eq 0) { $stashed = $true }
}

Write-Host "正在从 GitHub 拉取…" -ForegroundColor Cyan
& $git pull --rebase origin main

if ($LASTEXITCODE -ne 0) {
  Write-Host "拉取失败：检查网络，或先双击 推送.cmd 提交本地改动。" -ForegroundColor Red
  if ($stashed) {
    & $git stash pop | Out-Null
    Write-Host "已把本地改动放回。" -ForegroundColor Yellow
  }
  Read-Host "按回车关闭"
  return
}

if ($stashed) {
  & $git stash pop | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "本地改动和云端有冲突，已保留在 git stash 里（git stash list 可查看）。" -ForegroundColor Yellow
  } else {
    Write-Host "本地改动已放回。" -ForegroundColor Green
  }
}

$after = (& $git rev-parse HEAD).Trim()
Write-Host ""

if ($before -eq $after) {
  Write-Host "本地已经是最新的，没有新内容。" -ForegroundColor Green
} else {
  $files = & $git diff --name-only $before $after
  Write-Host "本次更新了 $($files.Count) 个文件：" -ForegroundColor Green
  $files | ForEach-Object { Write-Host "  - $_" }
  Write-Host ""
  Write-Host "新的提交：" -ForegroundColor Cyan
  & $git log --oneline "$before..$after"
}

Write-Host ""
Write-Host "本地预览：双击 index.html（看到旧内容就按 Ctrl+F5 强制刷新）" -ForegroundColor Green
Read-Host "按回车关闭"
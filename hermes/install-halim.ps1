# Pasang skill Halim ke Hermes Agent (Windows PowerShell).
# Jalankan SELEPAS pemasang Hermes siap, dari folder repo ini:
#   .\hermes\install-halim.ps1
$ErrorActionPreference = 'Stop'
$src = Join-Path $PSScriptRoot 'skills\halim'
$dst = Join-Path $HOME '.hermes\skills\halim'
if (-not (Test-Path $src)) { throw "Tidak jumpa $src" }
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item -Path (Join-Path $src '*') -Destination $dst -Recurse -Force
Write-Host "Halim dipasang di $dst. Mulakan semula Hermes dan tanya: 'Guna skill halim'."

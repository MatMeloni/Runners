# Executa testes de integração e unidade (Windows). Requer venv na raiz com dependências de teste.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$venvPy = Join-Path $root ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPy)) {
    Write-Error "Crie o venv: python -m venv .venv && .\.venv\Scripts\pip install -r requirements.txt"
}

& $venvPy -m pytest (Join-Path $root "tests\integration") (Join-Path $root "tests\unit") -q --tb=short
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Todos os testes passaram."

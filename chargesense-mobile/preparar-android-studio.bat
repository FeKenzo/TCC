@echo off
setlocal
for %%I in ("%~dp0..") do set "PASTA_TCC=%%~fI"

if exist R:\ (
  echo A unidade R: ja esta em uso. Libere-a ou ajuste a letra neste arquivo.
  exit /b 1
)

subst R: "%PASTA_TCC%"
if errorlevel 1 (
  echo Nao foi possivel criar a unidade R:.
  exit /b 1
)

echo Abra R:\chargesense-mobile no VS Code.
echo Para o Android Studio, abra R:\chargesense-mobile\android.
echo Mantenha esta unidade conectada enquanto estiver trabalhando.

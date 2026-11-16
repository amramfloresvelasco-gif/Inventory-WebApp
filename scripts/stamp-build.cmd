@echo off
setlocal
cd /d "%~dp0.."
if errorlevel 1 exit /b 1
for /f %%H in ('git rev-parse --short=8 HEAD') do set "INV_COMMIT=%%H"
if not defined INV_COMMIT (
  echo ERROR: Cannot read Git commit.
  exit /b 1
)
> "src\BuildInfo.gs" echo // Generated locally before clasp push. Do not edit or commit.
>> "src\BuildInfo.gs" echo function apiInventoryBuildInfo() {
>> "src\BuildInfo.gs" echo   return {commit:'%INV_COMMIT%',builtAt:'%DATE% %TIME%'};
>> "src\BuildInfo.gs" echo }
echo Inventory deployment stamp: %INV_COMMIT%
echo Next: clasp status ^& clasp push
endlocal

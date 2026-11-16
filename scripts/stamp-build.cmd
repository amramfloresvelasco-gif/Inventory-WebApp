@echo off
setlocal
pushd "%~dp0.." || exit /b 1
set "INV_COMMIT="
for /f "usebackq delims=" %%H in (`git rev-parse --short=8 HEAD 2^>nul`) do set "INV_COMMIT=%%H"
if not defined INV_COMMIT (
  echo ERROR: Cannot read Git commit from repository.
  popd
  exit /b 1
)
> "src\BuildInfo.gs" echo // Generated locally before clasp push. Do not edit or commit.
>> "src\BuildInfo.gs" echo function apiInventoryBuildInfo() {
>> "src\BuildInfo.gs" echo   return {commit:'%INV_COMMIT%',builtAt:'%DATE% %TIME%'};
>> "src\BuildInfo.gs" echo }
echo Inventory deployment stamp: %INV_COMMIT%
echo Next: clasp status ^& clasp push
popd
endlocal

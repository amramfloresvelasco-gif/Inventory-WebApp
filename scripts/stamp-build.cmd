@echo off
setlocal
set "PROJECT_DIR=%~dp0.."
set "INV_COMMIT="
git -C "%PROJECT_DIR%" rev-parse --short=8 HEAD > "%PROJECT_DIR%\src\.inventory-commit.tmp"
if errorlevel 1 goto :failed
set /p INV_COMMIT=<"%PROJECT_DIR%\src\.inventory-commit.tmp"
del /q "%PROJECT_DIR%\src\.inventory-commit.tmp" >nul 2>&1
if not defined INV_COMMIT goto :failed
> "%PROJECT_DIR%\src\BuildInfo.gs" echo // Generated locally before clasp push. Do not edit or commit.
>> "%PROJECT_DIR%\src\BuildInfo.gs" echo function apiInventoryBuildInfo() {
>> "%PROJECT_DIR%\src\BuildInfo.gs" echo   return {commit:'%INV_COMMIT%',builtAt:'%DATE% %TIME%'};
>> "%PROJECT_DIR%\src\BuildInfo.gs" echo }
echo Inventory deployment stamp: %INV_COMMIT%
echo Next: clasp status ^& clasp push
exit /b 0
:failed
del /q "%PROJECT_DIR%\src\.inventory-commit.tmp" >nul 2>&1
echo ERROR: Cannot read Git commit.
exit /b 1

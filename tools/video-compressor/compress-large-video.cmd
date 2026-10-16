@echo off
if "%~1"=="" (
  echo Drag a video onto this file, or run it with a video path.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0compress-large-video.ps1" -VideoPath "%~1"
if errorlevel 1 (
  echo Compression failed. Your original video is unchanged.
) else (
  echo The output MP4 is beside the original video.
)
pause

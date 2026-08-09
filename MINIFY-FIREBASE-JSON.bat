@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Firebase JSON Minifier - Quick Launcher
REM ═══════════════════════════════════════════════════════════════════════════
REM
REM This batch file launches the PowerShell script to minify Firebase JSON
REM Double-click this file to run
REM
REM ═══════════════════════════════════════════════════════════════════════════

title Firebase JSON Minifier

REM Run PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0minify-firebase-json.ps1"

REM Keep window open if there was an error
if errorlevel 1 pause

@echo off
title Olivine School DZ - Local Server
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-site.ps1"
if errorlevel 1 pause

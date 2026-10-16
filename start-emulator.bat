@echo off
REM Bariisaa Tv - Android Emulator launcher
REM
REM GPU notes for this machine (Win11 build 26300 + Intel UHD):
REM   -gpu angle              -> rejected by emulator 37.x ("not valid")
REM   -gpu host               -> UpdateLayeredWindowIndirect fails -> black window
REM   -gpu host_indirect      -> WORKS (window renders; screencap black is normal)
REM   -gpu swiftshader_indirect -> slow (~6 min boot) but also works
REM
REM screencap will show black — that is expected with GPU passthrough.
REM The emulator WINDOW itself displays the app correctly.
set EMU=C:\Users\Administrator\AppData\Local\Android\Sdk\emulator\emulator.exe
start "" "%EMU%" -avd Medium_Phone_2 -no-snapshot -no-boot-anim -gpu host_indirect -no-metrics

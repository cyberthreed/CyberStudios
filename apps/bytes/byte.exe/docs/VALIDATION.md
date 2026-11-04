# Byte v1.0.0 validation

Validated on Windows x64 on November 4, 2026, with Node 24.22.1, Electron 45.2.2, and Playwright Core 1.64.1.

- **14 core tests passed:** prior preference/position/behavior/manifest checks plus migration and persistence of star/talk counters, bounded care/activity, timed Talk/Dance reactions, and atlas validation.
- The expanded Electron suite covers star tossing by mouse and keyboard, cancelled throws, saved catches, varying Talk replies, Dance and reduced motion, overlay hide/show, taskbar Desktop mode, restoring the room from the cat, and full process exit from the header Quit button, native window close, and cat ×. It retains the original interaction, security, drag/follow, settings, and restart-persistence checks.
- **Design checks:** desktop room, narrow 390-pixel window, night mode, reference-inspired sprite rendering, and no horizontal overflow at the narrow viewport. Screenshots were visually reviewed.
- **Preferences visibility:** the panel is open by default at the top of the sidebar, the header button focuses and scrolls to it, and all existing controls continue to save and restore. The package reports version 1.0.0.
- **Development and packaged builds passed the expanded Electron suite.** Quit Byte, native window close, and the cat's × each ended the main process cleanly with exit code 0. Star/talk counters and prior care/settings survived a complete quit/relaunch.
- Drag and follow use real native windows with controlled OS-cursor samples in the test process. They are not physical mixed-DPI mouse tests.
- The new PNG is an RGBA four-column by six-row atlas. The app reads the correct row for all six states; it does not load a screenshot of the UI as its interface.

## Reproduce

```powershell
npm ci
npm test
npm run test:desktop
npm run package:win
```

To check the portable app instead of the development executable:

```powershell
$env:BYTE_SMOKE_EXECUTABLE = Join-Path (Get-Location) 'dist\Byte Resident-win32-x64\Byte.exe'
npm run test:desktop
Remove-Item Env:BYTE_SMOKE_EXECUTABLE
```

Each desktop test uses a unique project-local test profile. Normal saved preferences are untouched. Source archives and packaged apps exclude test profiles and development dependencies.

Physical mouse/tray interaction, click-through against another application, mixed-DPI monitor dragging, monitor hot unplug, Remote Desktop, and exclusive-fullscreen overlays still need a manual Windows check. The computer-use helper failed to initialize earlier in this chat; no physical tests are claimed here. The executable is unsigned.

The current artwork is approved by the user and unchanged from the previous release. There is no gameplay SDK integration, account, tracking, punishment/decay system, installer, startup registration, or auto-updater. The only shortcut created is Open Byte inside the chosen Byte project folder.

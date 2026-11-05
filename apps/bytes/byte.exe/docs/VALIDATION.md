# Byte v1.0.0 layout validation

Checked on Windows x64 on November 5, 2026, with Node 24.22.1, Electron 45.2.2, Electron Packager 20.3.0, and Playwright Core 1.64.1. The application version remains **1.0.0**.

## Results

- All **14 core tests passed**, including saved care/settings, safe migration, bounded counters, behavior, monitor bounds, and sprite validation.
- The real Electron interaction suite passed on the final packaged Windows build with the existing host-specific topmost limitation explicitly enabled and reported as described below.
- The new Room, Care, Activity, and Settings tabs show exactly one view at a time. Keyboard Left/Right/Home/End navigation and Escape-to-Room were exercised.
- The default Room view fits its normal desktop window without vertical scrolling. A 390-pixel window and its Settings view have no horizontal overflow. Desktop, narrow, Care, Activity, Settings, and night-room screenshots were reviewed.
- First launch draws the approved sprite before any interaction. The renderer refreshes native room visibility after the atlas finishes decoding, avoiding a stale initial visibility snapshot.
- Changing tabs during a star chase cancels the chase without awarding a catch. Normal catches, manual cancellation, keyboard tossing, saved counts, Talk, Dance, pet/feed/play/nap, and reduced motion continue to work.
- The room button and Settings switch for night mode remain synchronized. Settings persist after a complete quit and relaunch. Hidden tabs stop the room sprite timer.
- Desktop mode, restoring the room from the desktop cat, hiding/showing the pet, Bring Byte home, native titlebar close, the header Quit button, and the desktop cat's Quit control were exercised.
- Existing context isolation, sandboxing, sender checks, denied network/navigation/popups, drag/follow with controlled cursor samples, and restart persistence checks passed.
- The strict local protocol allowlist includes the new bundled `room-layout.css` file. No remote assets, plugins, accounts, services, or dependencies were added.
- The approved sprite atlas, Byte application icon, save format, movement rules, mobile project, and version number are unchanged.

## Existing topmost limitation on this host

On this Windows test host, Electron reports `isAlwaysOnTop() === false` for the native desktop window even when the stored preference is true. The same assertion failed on the preceding, unchanged release. This layout update does not change the overlay implementation.

The desktop test remains strict by default. For this environment, it was run with the explicit `BYTE_TEST_ALLOW_TOPMOST_MISMATCH=1` flag: it prints a limitation, checks that the stored default is true, and continues with all other assertions. **A native always-on-top pass is not claimed.** Actual mixed-DPI monitor crossings and physical mouse input are not validated by this suite either.

## Reproduce

```powershell
npm ci
npm test
npm run package:win
$env:BYTE_SMOKE_EXECUTABLE=Join-Path $PWD 'dist\Byte Resident-win32-x64\Byte.exe'
npm run test:desktop
```

Only on a host showing the documented baseline mismatch, run the interaction suite with:

```powershell
$env:BYTE_TEST_ALLOW_TOPMOST_MISMATCH='1'
npm run test:desktop
```

Test profiles and screenshots are created under `test-results`; normal care data is not used by the checks. There is no native mobile build or multi-monitor movement update in this change.

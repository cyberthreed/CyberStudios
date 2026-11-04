# 🐈‍⬛ BYTE.EXE ♡

### ✧ your tiniest desktop resident has arrived.

**A cozy, interactive desktop companion by CyberStudios.**

`version 1.0.0` · `windows x64` · `electron` · `made with ♡`

☁️　🎀　💿　🫧　✧　🐾

---

## ୨୧ hello, i'm byte! ♡

*somewhere between your desktop and a daydream, a little cat has made himself at home.*

Meet **Byte**, the original Byte and CyberStudios' official pixel-cat mascot!

He's a tiny purple-and-black kitten with bright cyan eyes, a starry little personality, and an impressive ability to make your computer feel less lonely.

Byte isn't just a decoration. He can wander around your desktop, follow your cursor, play games, take naps, and respond when you interact with him.

You can keep him in his cozy little room or let him explore your desktop while you work, code, or browse.

**No chores. No punishments. Just a little digital friend.** ♡

---

## 🎀 download byte.exe

### ♡ ready to adopt?

**Download:** `Byte-v1.0.0-Windows-x64.zip`

Find the latest available build in the [CyberStudios Releases](https://github.com/cyberthreed/CyberStudios/releases).

### ✧ installation

1. Download the Windows x64 ZIP from the release assets.
2. Extract the ZIP into a normal, writable folder.
3. Open the extracted folder.
4. Double-click `Byte.exe`.
5. Say hello to your newest desktop resident! 🐾

**Please keep all extracted application files together.** Byte needs them to run properly.

The portable Windows build includes Electron, so there's no need to install Node.js or Electron separately.

**A little heads-up:** Byte.exe is currently an unsigned application. Windows may display a security warning. Only download it from the official CyberStudios release, verify its checksum if desired, and make sure you trust the download before running it.

---

## ☁️ things byte can do

| ♡ Interaction | ✧ What happens |
|---|---|
| 🩷 Pet | Give Byte affection, hear him purr, and increase happiness and friendship. |
| 🍓 Feed | Give him a little snack and refill his fullness meter. |
| 🧸 Play | Watch Byte chase sparkles and enjoy some playtime. |
| 💬 Talk | Get a cozy little reply from Byte's collection of phrases. |
| ⭐ Toss a star | Throw a star somewhere in his room and watch him chase it. |
| 🎀 Happy dance | Byte celebrates with a tiny wiggle! |
| 🌙 Rest | Let Byte curl up for a nap, then wake him when you're ready. |
| 🐾 Desktop mode | Let Byte roam outside his room and explore your desktop. |
| ☁️ Follow cursor | Byte can follow your pointer around his current monitor. |
| 🫧 Wander | Watch him stroll around on his own. |
| 🏠 Bring Byte home | Return Byte to a safe position on your primary monitor. |

Byte's care meters and friendship values save automatically.

**And don't worry about leaving him alone.** His needs don't decay over time, and he'll never punish you for being away.

---

## 💜 two little worlds

### ☀️ daytime dreams

Soft pinks, lavender accents, and a dreamy pastel room for Byte to call home.

### 🌙 nighttime pixels

A cozy nighttime palette for late-night coding sessions, gaming, or simply hanging out.

Switch between **Day Room** and **Night Room** whenever you like. Byte remembers your choice.

---

## 🖥️ let byte live on your desktop

Byte.exe includes a transparent desktop companion that can appear over your other windows.

**Desktop mode** minimizes his room to the taskbar while letting him continue exploring.

You can:

- Drag Byte to a new position or monitor.
- Enable or disable cursor following.
- Let him wander independently.
- Change his size, palette, and movement speed.
- Toggle always-on-top behavior.
- Hide or show the desktop cat.
- Turn on reduced motion for a quieter experience.

His settings live in the **Desktop Preferences** panel, accessible from the room's sidebar or the header's Preferences button.

To reopen his room, click Byte's taskbar button or use the little **⌂** control when hovering over or focusing the desktop cat.

To close everything, use the window's **×**, press `Alt + F4`, or select **Quit Byte**. These actions exit the desktop companion and tray icon too.

*Byte may be clingy, but he understands when it's time to go.* ♡

---

## 🎮 tiny shortcuts

You can use these keys while Byte's room is active.

| Key | Action |
|---|---|
| `1` | Pet |
| `2` | Feed |
| `3` | Play |
| `4` | Rest / Wake |
| `5` | Talk |
| `6` | Star game |
| `7` | Happy dance |
| `Space` | Toss a star during the star game |
| `Esc` | Finish the star game, or enter Desktop mode outside a game |

Shortcuts won't interrupt you while you're typing into an input field.

Cancelled star throws don't count as catches, and Byte remembers his successful catches across restarts.

---

## 💾 byte remembers!

Your little companion remembers his care stats, preferences, star catches, and desktop position.

Byte saves his data locally at:

`%APPDATA%\CyberStudios\Byte\byte-state.json`

His saved data includes:

- Happiness, fullness, energy, and friendship
- Desktop position
- Visual and movement preferences
- Star-catching progress
- Recent activity

Position changes are saved periodically and when you finish dragging or quit. Other settings and care changes save immediately.

Older v0.1.0 preferences migrate automatically.

### ✧ starting fresh

If you'd like to reset Byte, close the application completely and rename the saved `byte-state.json` file.

You can also use **Bring Byte home** to fix his desktop position without resetting your other progress.

---

## 🛠️ for the curious little developers

*Want to peek inside Byte's world?*

Byte.exe is built with **Electron, HTML, CSS, and JavaScript**.

There's no frontend framework, bundler, or CyberCore Gameplay SDK integration.

### ♡ run from source

**Requirements:**

- Node.js 24 LTS recommended (minimum 22.16)
- Visual Studio Code or another code editor

Open the Byte project folder in VS Code and run:

```powershell
npm ci
npm start
```

The initial installation or launch may download Electron. Later launches can work offline.

If PowerShell blocks `npm.ps1`, use:

```powershell
npm.cmd ci
npm.cmd start
```

To launch only the transparent desktop companion:

```powershell
npm start -- --pet-only
```

You can also use the included VS Code launch configuration and tasks.

If Byte is already running, launching the application again reopens his existing room.

### ✧ testing and packaging

```powershell
npm test
npm run test:desktop
npm run package:win
```

The portable Windows application is generated at:

`dist/Byte Resident-win32-x64/Byte.exe`

Distribute the **entire generated application folder**, not just the executable.

There is currently no installer, automatic startup registration, auto-update system, or code-signing configuration.

Desktop tests use separate profiles under `test-results/` and do not overwrite your normal pet data.

For more information, see [Validation & Testing](docs/VALIDATION.md).

---

## 🎨 customize byte's little universe

Interested in changing his colors, studying his animations, or learning how his behavior works?

Here's where the magic happens:

| File | Purpose |
|---|---|
| `src/renderer/styles.css` | Room styling, colors, responsive layout, and nighttime palette |
| `src/lib/behavior.cjs` | Animation and movement behavior |
| `src/lib/care.cjs` | Care stats and activity messages |
| `src/lib/state.cjs` | Preferences, validation, and persistence |
| `src/main.cjs` | Desktop windows, menus, and tray |
| `src/preload.cjs` | Narrow communication between Electron and the renderer |

**More documentation:**

- [Sprite & Animation Guide](docs/SPRITES.md)
- [Art Notes](docs/ART-NOTES.md)
- [Validation & Testing](docs/VALIDATION.md)

Byte's approved sprite artwork is preserved in this release.

**Important:** Running `npm run assets` restores an older geometric placeholder and overwrites the active sprite manifest. Back up any custom assets before using it. This command does not recreate the approved v0.2.0 concept artwork.

---

## 🔒 a little note about privacy

Byte is designed to be a **local desktop companion**.

He doesn't need an account, cloud service, or AI provider to interact with you.

The application does not include telemetry, remote art generation, global keylogging, or a CyberCore SDK connection.

His speech uses predefined local phrases, not a chatbot or online conversation service.

The Electron application includes security protections such as sandboxing, context isolation, a content security policy, restricted local resource access, permission denial, blocked external navigation and downloads, and validated communication between application components.

Cursor position is used locally for pet movement and hit testing.

Some desktop behaviors can vary with Windows display scaling, multiple monitors, Remote Desktop, and fullscreen applications. Reduced motion can disable animated movement and following while keeping manual interactions available.

Keep Electron updated before distributing future builds.

---

## ✧ welcome to the bytes family

**Bytes** are a growing family of digital desktop companions created by CyberStudios.

Every Byte has a personality.

And this little guy?

He's **Byte**, the very first Byte, named Byte. ♡

As the Bytes universe grows, more companions, personalities, and interactive experiences may join him.

But Byte will always be the original.

---

## 💿 about cyberstudios

**CyberStudios** is an independent creative technology studio exploring immersive games, adaptive AI gameplay systems, digital art, creative coding, and experimental software.

We believe technology can be expressive, nostalgic, personal, and playful.

Our projects range from advanced gameplay frameworks to tiny companions who want nothing more than to nap on your desktop.

**Explore the studio:**

♡ [CyberStudios GitHub](https://github.com/cyberthreed/CyberStudios)

✧ [CyberStudios Wiki](https://cyberstudioswiki.neocities.org/)

---

### ♡ thanks for adopting byte!

*may your code compile, your desktop stay cozy, and your little pixel companion always find his way home.*

**made with ♡ by CyberStudios**

`byte.exe is running...` 🐈‍⬛

☁️　🩷　✧　🫧　💿　🐾

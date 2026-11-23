# ♡ publishing the Blender theme collection ✧

**dream in pixels. create without limits.**

## 🗂️ prepare the source folders

1. Open https://github.com/cyberthreed/CyberStudios/tree/main/themes/blender.
2. Choose **Add file → Upload files**.
3. In File Explorer, select the source collection’s contents, including all nineteen theme folders, the root files, and `tools`.
4. Drag the selected contents into GitHub's upload area. The theme folders belong directly under `themes/blender`. Cotton Candy files belong inside `cybercore cotton candy`.
5. Review the file list and commit the collection changes to **main**.
6. Check that the Blender folder shows this collection README and that each theme folder contains its XML and preview.

The curated source folder contains public project files only. The tools are rebuild scripts; they are not needed to install a theme. Keep local instruction files, private review notes, recovery copies, and diagnostics outside this upload.

## 💿 create the GitHub Release

1. Open https://github.com/cyberthreed/CyberStudios/releases/new.
2. Under **Choose a tag**, enter **blender-themes-v1.1.0** and choose **Create new tag**.
3. Set **Target** to **main**, after the source upload has been committed.
4. Use this title: **♡ CyberStudios Blender Themes · 1.1.0**.
5. Copy the contents of `RELEASE_NOTES.md` into the release description.
6. Attach these files from the sibling **releases** folder:
   - `CyberStudios-Blender-Themes-1.1.0.zip` — the twenty installable presets, guide, license, and checksum list.
   - `CyberStudios-Blender-Themes-Source-1.1.0.zip` — the full curated source collection.
   - `SHA256SUMS.txt` — integrity hashes for the two ZIP files.
7. Review the **pre-release** and **latest release** options. Mark test builds as pre-releases. The latest label applies to the whole CyberStudios repository, which also has Byte and VS Code releases.
8. Choose **Save draft** for review or **Publish release** to make the downloads available.
9. Open the release page and confirm both ZIP downloads are listed under **Assets**.

Use the Blender-specific tag above so this collection has its own release history alongside the other CyberStudios projects.

GitHub reference: https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository

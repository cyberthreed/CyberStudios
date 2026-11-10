bl_info = {
    "name": "CyberStudios Theme Switcher",
    "author": "CyberStudios",
    "version": (1, 0, 0),
    "blender": (4, 2, 0),
    "location": "Preferences > Themes, and Preferences > Add-ons > CyberStudios Theme Switcher",
    "description": "Switch between the CyberStudios themes and any installed theme, paste theme XML, save it under a name and export it.",
    "category": "Interface",
}

import os
import re
import shutil
import xml.etree.ElementTree as ET

import bpy
from bpy.props import StringProperty, BoolProperty
from bpy.types import AddonPreferences, Menu, Operator
from bpy_extras.io_utils import ExportHelper, ImportHelper

PRESET_MENU = "USERPREF_MT_interface_theme_presets"
BUNDLED_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "themes")
MAX_XML_BYTES = 2 * 1024 * 1024


def user_dir():
    path = None
    try:
        path = bpy.utils.extension_path_user(__package__, create=True)
    except Exception:
        pass
    if not path:
        path = bpy.utils.user_resource("CONFIG", path="cyberstudios_themes", create=True)
    path = os.path.join(path, "my_themes")
    os.makedirs(path, exist_ok=True)
    return path


def display_name(path):
    return os.path.splitext(os.path.basename(path))[0].replace("_", " ")


def safe_filename(name):
    name = re.sub(r"[^\w\- ]+", "", name, flags=re.UNICODE).strip()
    return re.sub(r"\s+", "_", name)


def list_xml(folder):
    if not os.path.isdir(folder):
        return []
    files = [f for f in os.listdir(folder) if f.lower().endswith(".xml")]
    return sorted(((display_name(f), os.path.join(folder, f)) for f in files), key=lambda t: t[0].lower())


def installed_themes():
    skip = {os.path.normcase(os.path.realpath(BUNDLED_DIR)), os.path.normcase(os.path.realpath(user_dir()))}
    seen, found = set(), []
    for folder in bpy.utils.preset_paths("interface_theme"):
        if os.path.normcase(os.path.realpath(folder)) in skip:
            continue
        for name, path in list_xml(folder):
            if path not in seen:
                seen.add(path)
                found.append((name, path))
    return sorted(found, key=lambda t: t[0].lower())


def validate_theme_xml(text):
    """Return (bytes, error). Accepts the XML written by Blender's theme presets."""
    data = text.strip().encode("utf-8")
    if not data:
        return None, "Nothing to save: the theme code is empty."
    if len(data) > MAX_XML_BYTES:
        return None, "That text is too large to be a Blender theme."
    try:
        root = ET.fromstring(data)
    except ET.ParseError as exc:
        return None, "That isn't valid XML: %s" % exc
    if root.tag != "bpy" or root.find("Theme") is None:
        return None, "That XML isn't a Blender theme. It should start with <bpy><Theme>."
    return data, None


def save_user_theme(name, data, overwrite):
    filename = safe_filename(name)
    if not filename:
        return None, "Give the theme a name first."
    path = os.path.join(user_dir(), filename + ".xml")
    if os.path.exists(path) and not overwrite:
        return None, "A saved theme called '%s' already exists. Tick Overwrite or pick another name." % display_name(path)
    with open(path, "wb") as fh:
        fh.write(data)
    return path, None


class CSTHEME_Preferences(AddonPreferences):
    bl_idname = __package__

    theme_name: StringProperty(name="Name", description="Name to save the pasted theme under")
    pending_xml: StringProperty(options={"HIDDEN"})
    overwrite: BoolProperty(name="Overwrite if it exists", default=False)

    def draw(self, context):
        layout = self.layout
        current = getattr(getattr(bpy.types, PRESET_MENU, None), "bl_label", "")
        if current:
            layout.label(text="Last applied: %s" % current, icon="CHECKMARK")

        self.draw_section(layout, "CyberStudios themes", list_xml(BUNDLED_DIR), "bundled", "COLOR")
        self.draw_section(layout, "My saved themes", list_xml(user_dir()), "mine", "FILE_TICK",
                          empty="Nothing saved yet. Paste a theme below.")
        self.draw_section(layout, "Other installed themes", installed_themes(), "installed", "PREFERENCES")

        box = layout.box()
        box.label(text="Add a theme", icon="PASTEDOWN")
        box.prop(self, "theme_name")
        row = box.row(align=True)
        row.operator("cyberstudios.paste_theme", icon="PASTEDOWN")
        row.operator("cyberstudios.import_theme", icon="IMPORT")
        if self.pending_xml:
            box.label(text="Theme code ready (%d characters)." % len(self.pending_xml), icon="CHECKMARK")
        box.prop(self, "overwrite")
        row = box.row()
        row.enabled = bool(self.pending_xml and self.theme_name.strip())
        row.operator("cyberstudios.save_pasted", icon="FILE_TICK")
        box.operator("cyberstudios.save_current", icon="COLORSET_03_VEC")

    def draw_section(self, layout, title, themes, kind, icon, empty=None):
        box = layout.box()
        box.label(text="%s (%d)" % (title, len(themes)), icon=icon)
        if not themes and empty:
            box.label(text=empty)
        for name, path in themes:
            row = box.row(align=True)
            op = row.operator("cyberstudios.apply_theme", text=name)
            op.filepath = path
            op = row.operator("cyberstudios.copy_theme", text="", icon="COPYDOWN")
            op.filepath = path
            op = row.operator("cyberstudios.export_theme", text="", icon="EXPORT")
            op.source = path
            if kind == "mine":
                op = row.operator("cyberstudios.delete_theme", text="", icon="TRASH")
                op.filepath = path


class CSTHEME_OT_apply(Operator):
    bl_idname = "cyberstudios.apply_theme"
    bl_label = "Apply Theme"
    bl_description = "Switch the Blender interface to this theme"
    bl_options = {"REGISTER"}

    filepath: StringProperty(subtype="FILE_PATH", options={"SKIP_SAVE"})

    def execute(self, context):
        if not os.path.isfile(self.filepath):
            self.report({"ERROR"}, "Theme file not found.")
            return {"CANCELLED"}
        try:
            bpy.ops.script.execute_preset(filepath=self.filepath, menu_idname=PRESET_MENU)
        except Exception as exc:
            self.report({"ERROR"}, "Could not apply theme: %s" % exc)
            return {"CANCELLED"}
        self.report({"INFO"}, "Applied %s" % display_name(self.filepath))
        return {"FINISHED"}


class CSTHEME_OT_copy(Operator):
    bl_idname = "cyberstudios.copy_theme"
    bl_label = "Copy Theme Code"
    bl_description = "Copy this theme's XML code to the clipboard"

    filepath: StringProperty(subtype="FILE_PATH", options={"SKIP_SAVE"})

    def execute(self, context):
        try:
            with open(self.filepath, "r", encoding="utf-8") as fh:
                context.window_manager.clipboard = fh.read()
        except OSError as exc:
            self.report({"ERROR"}, "Could not read theme: %s" % exc)
            return {"CANCELLED"}
        self.report({"INFO"}, "Copied %s to the clipboard" % display_name(self.filepath))
        return {"FINISHED"}


class CSTHEME_OT_export(Operator, ExportHelper):
    bl_idname = "cyberstudios.export_theme"
    bl_label = "Export Theme"
    bl_description = "Save a copy of this theme's XML file to your computer"

    filename_ext = ".xml"
    filter_glob: StringProperty(default="*.xml", options={"HIDDEN"})
    source: StringProperty(options={"HIDDEN", "SKIP_SAVE"})

    def invoke(self, context, event):
        self.filepath = os.path.basename(self.source)
        return super().invoke(context, event)

    def execute(self, context):
        try:
            shutil.copyfile(self.source, self.filepath)
        except OSError as exc:
            self.report({"ERROR"}, "Could not export theme: %s" % exc)
            return {"CANCELLED"}
        self.report({"INFO"}, "Exported to %s" % self.filepath)
        return {"FINISHED"}


class CSTHEME_OT_delete(Operator):
    bl_idname = "cyberstudios.delete_theme"
    bl_label = "Delete Saved Theme"
    bl_description = "Remove this theme from My saved themes"

    filepath: StringProperty(subtype="FILE_PATH", options={"SKIP_SAVE"})

    def invoke(self, context, event):
        return context.window_manager.invoke_confirm(self, event)

    def execute(self, context):
        inside = os.path.normcase(os.path.realpath(self.filepath)).startswith(os.path.normcase(os.path.realpath(user_dir())))
        if not inside:
            self.report({"ERROR"}, "Only your saved themes can be deleted here.")
            return {"CANCELLED"}
        try:
            os.remove(self.filepath)
        except OSError as exc:
            self.report({"ERROR"}, "Could not delete theme: %s" % exc)
            return {"CANCELLED"}
        return {"FINISHED"}


class CSTHEME_OT_paste(Operator):
    bl_idname = "cyberstudios.paste_theme"
    bl_label = "Paste Theme Code"
    bl_description = "Read theme XML from the clipboard"

    def execute(self, context):
        prefs = context.preferences.addons[__package__].preferences
        data, error = validate_theme_xml(context.window_manager.clipboard)
        if error:
            self.report({"ERROR"}, error)
            return {"CANCELLED"}
        prefs.pending_xml = data.decode("utf-8")
        self.report({"INFO"}, "Theme code pasted. Name it, then press Save.")
        return {"FINISHED"}


class CSTHEME_OT_import(Operator, ImportHelper):
    bl_idname = "cyberstudios.import_theme"
    bl_label = "Import XML File"
    bl_description = "Load a theme XML file from your computer"

    filename_ext = ".xml"
    filter_glob: StringProperty(default="*.xml", options={"HIDDEN"})

    def execute(self, context):
        prefs = context.preferences.addons[__package__].preferences
        try:
            with open(self.filepath, "r", encoding="utf-8-sig") as fh:
                text = fh.read(MAX_XML_BYTES + 1)
        except (OSError, UnicodeDecodeError) as exc:
            self.report({"ERROR"}, "Could not read file: %s" % exc)
            return {"CANCELLED"}
        data, error = validate_theme_xml(text)
        if error:
            self.report({"ERROR"}, error)
            return {"CANCELLED"}
        prefs.pending_xml = data.decode("utf-8")
        if not prefs.theme_name.strip():
            prefs.theme_name = display_name(self.filepath)
        self.report({"INFO"}, "Theme loaded. Check the name, then press Save.")
        return {"FINISHED"}


class CSTHEME_OT_save_pasted(Operator):
    bl_idname = "cyberstudios.save_pasted"
    bl_label = "Save Theme"
    bl_description = "Save the pasted theme under this name"

    def execute(self, context):
        prefs = context.preferences.addons[__package__].preferences
        data, error = validate_theme_xml(prefs.pending_xml)
        if error:
            self.report({"ERROR"}, error)
            return {"CANCELLED"}
        path, error = save_user_theme(prefs.theme_name, data, prefs.overwrite)
        if error:
            self.report({"ERROR"}, error)
            return {"CANCELLED"}
        prefs.pending_xml = ""
        prefs.theme_name = ""
        self.report({"INFO"}, "Saved %s" % display_name(path))
        return {"FINISHED"}


class CSTHEME_OT_save_current(Operator):
    bl_idname = "cyberstudios.save_current"
    bl_label = "Save Current Theme As..."
    bl_description = "Save the theme Blender is using right now under a name"

    name: StringProperty(name="Name")
    overwrite: BoolProperty(name="Overwrite if it exists", default=False)

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self)

    def execute(self, context):
        import tempfile
        try:
            import _rna_xml as rna_xml
        except ImportError:
            import rna_xml
        preset_menu = getattr(bpy.types, PRESET_MENU)
        tmp = tempfile.NamedTemporaryFile(suffix=".xml", delete=False)
        tmp.close()
        try:
            rna_xml.xml_file_write(context, tmp.name, preset_menu.preset_xml_map)
            with open(tmp.name, "r", encoding="utf-8") as fh:
                data, error = validate_theme_xml(fh.read())
        except Exception as exc:
            self.report({"ERROR"}, "Could not read the current theme: %s" % exc)
            return {"CANCELLED"}
        finally:
            os.remove(tmp.name)
        if error:
            self.report({"ERROR"}, error)
            return {"CANCELLED"}
        path, error = save_user_theme(self.name, data, self.overwrite)
        if error:
            self.report({"ERROR"}, error)
            return {"CANCELLED"}
        self.report({"INFO"}, "Saved %s" % display_name(path))
        return {"FINISHED"}


class CSTHEME_MT_switcher(Menu):
    bl_idname = "CSTHEME_MT_switcher"
    bl_label = "Switch Theme"

    def draw(self, context):
        layout = self.layout
        groups = (
            ("CyberStudios", list_xml(BUNDLED_DIR)),
            ("My saved themes", list_xml(user_dir())),
            ("Installed", installed_themes()),
        )
        first = True
        for title, themes in groups:
            if not themes:
                continue
            if not first:
                layout.separator()
            first = False
            layout.label(text=title)
            for name, path in themes:
                layout.operator("cyberstudios.apply_theme", text=name).filepath = path


def draw_theme_panel(self, context):
    row = self.layout.row(align=True)
    row.menu("CSTHEME_MT_switcher", text="CyberStudios Theme Switcher", icon="COLOR")
    row.operator("preferences.addon_show", text="", icon="PREFERENCES").module = __package__


classes = (
    CSTHEME_Preferences,
    CSTHEME_OT_apply,
    CSTHEME_OT_copy,
    CSTHEME_OT_export,
    CSTHEME_OT_delete,
    CSTHEME_OT_paste,
    CSTHEME_OT_import,
    CSTHEME_OT_save_pasted,
    CSTHEME_OT_save_current,
    CSTHEME_MT_switcher,
)


def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    bpy.types.USERPREF_PT_theme.prepend(draw_theme_panel)


def unregister():
    bpy.types.USERPREF_PT_theme.remove(draw_theme_panel)
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)

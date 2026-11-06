"""Run with Blender --background --factory-startup --python build_themes.py.

Builds local XML presets with Blender's installed light-theme structure, then
imports and round-trips every color through Blender without saving preferences.
"""
import bpy
import _rna_xml
import contextlib
import io
import json
import pathlib
import tempfile
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = json.loads((ROOT / 'source-palettes.json').read_text(encoding='utf8'))
BASE = pathlib.Path(bpy.utils.system_resource('SCRIPTS')) / 'presets/interface_theme/Blender_Light.xml'
MENU = bpy.types.USERPREF_MT_interface_theme_presets


def fit(value, original):
    """Retain Blender's RGB/RGBA field shape, including intentional alpha."""
    if value.startswith('#') and original.startswith('#'):
        return value[:7] + (value[7:9] if len(value) == 9 else 'ff') if len(original) == 9 else value[:7]
    return value


def set_colors(element, values):
    for name, value in values.items():
        if name in element.attrib:
            element.set(name, fit(str(value), element.get(name)))


def build(variant):
    ui = SOURCE['soft']['ui'] | SOURCE[variant]['ui']
    sy = SOURCE['soft']['syntax'] | SOURCE[variant]['syntax']
    pearl, pink, lavender, blue = (ui[k] for k in ('editor.background', 'sideBar.background', 'titleBar.activeBackground', 'panel.background'))
    ink, border, accent = ui['editor.foreground'], ui['input.border'], ui['button.background']
    rose, strong_rose, purple = ui['editorCursor.foreground'], ui['terminalCursor.foreground'], sy['keywords']
    selected, soft_selected = ui['list.activeSelectionBackground'], ui['editor.selectionBackground']
    tree = ET.parse(BASE)
    root = tree.getroot()
    backgrounds = {'properties': pink, 'outliner': pink, 'preferences': pink,
                   'console': blue, 'graph_editor': blue, 'dopesheet_editor': blue,
                   'nla_editor': blue, 'sequence_editor': blue, 'statusbar': ui['statusBar.background']}
    for section in root.find('Theme'):
        bg = backgrounds.get(section.tag, pearl)
        for el in section.iter():
            tag = el.tag
            if tag in ('ThemeSpaceGeneric', 'ThemeSpaceGradient'):
                set_colors(el, dict(back=bg, title=ink, text=ink, text_hi=ui['button.foreground'],
                    header=lavender, header_text=ui['sideBar.foreground'], header_text_hi=ui['tab.activeForeground']))
            elif tag == 'ThemeGradientColors':
                set_colors(el, dict(background_type='SINGLE_COLOR', high_gradient=pearl, gradient=pearl))
            elif tag == 'ThemeWidgetColors':
                set_colors(el, dict(outline=border, outline_sel=ui['focusBorder'], inner=pearl,
                    inner_sel=selected, item=purple, text=ink, text_sel=ui['button.foreground'],
                    show_shaded='FALSE', roundness='0.4'))
            elif tag == 'ThemeUserInterface':
                set_colors(el, dict(widget_emboss='#62447510', editor_border=border,
                    editor_outline=ui['tab.border'], editor_outline_active=accent,
                    widget_text_cursor=rose, panel_header=ui['sideBarSectionHeader.background'],
                    panel_title=ui['sideBarTitle.foreground'], panel_text=ink, panel_back=pink,
                    panel_sub_back='#F2E5FF80', panel_outline='#D9B9EB80',
                    transparent_checker_primary=lavender, transparent_checker_secondary=pearl,
                    axis_x=ui['terminal.ansiRed'], axis_y=ui['terminal.ansiGreen'], axis_z=ui['terminal.ansiBlue'],
                    axis_w=purple, gizmo_hi=strong_rose, gizmo_primary=ui['terminal.ansiYellow'],
                    gizmo_secondary=ui['terminal.ansiCyan'], gizmo_view_align=purple,
                    gizmo_a=ui['terminal.ansiGreen'], gizmo_b=ui['terminal.ansiRed'],
                    icon_alpha='1', icon_saturation='1', icon_scene=purple, icon_collection=ui['sideBarTitle.foreground'],
                    icon_object=strong_rose, icon_object_data=ui['terminal.ansiGreen'], icon_modifier=sy['numbers'],
                    icon_shading=sy['strings'], icon_folder=ui['terminal.ansiYellow'], icon_autokey=ui['terminal.ansiRed']))
                for widget in el:
                    w = widget.find('ThemeWidgetColors')
                    if w is None:
                        continue
                    kind = widget.tag
                    if kind in ('wcol_tool', 'wcol_radio', 'wcol_toggle', 'wcol_tab'):
                        set_colors(w, dict(inner=lavender, inner_sel=accent))
                    elif kind in ('wcol_num', 'wcol_numslider'):
                        set_colors(w, dict(inner=ui['editor.lineHighlightBackground'], item=ui['statusBar.background'], inner_sel=soft_selected))
                    elif kind in ('wcol_menu_back', 'wcol_pulldown', 'wcol_menu'):
                        set_colors(w, dict(inner=ui['notifications.background'], inner_sel=selected))
                    elif kind == 'wcol_progress':
                        set_colors(w, dict(inner=blue, item=accent))
                    elif kind == 'wcol_scroll':
                        set_colors(w, dict(inner=lavender, item=ui['scrollbarSlider.hoverBackground'][:7]))
                    elif kind == 'wcol_toolbar_item':
                        set_colors(w, dict(inner=pink, inner_sel=selected))
            elif tag == 'ThemeWidgetStateColors':
                set_colors(el, dict(error=ui['terminal.ansiRed'], warning=ui['terminal.ansiYellow'],
                    info=sy['numbers'], success=ui['terminal.ansiGreen'], inner_anim='#A8D9CA', inner_anim_sel='#77B5A6',
                    inner_key='#F2D9A5', inner_key_sel='#DEBA7C', inner_driven='#D3B9F2', inner_driven_sel=accent,
                    inner_overridden='#B4E9FF', inner_overridden_sel='#A8DDEB', inner_changed='#F3B8D8', inner_changed_sel=rose))
            elif tag == 'ThemeRegionsAssetShelf':
                set_colors(el, dict(back=pink, header_back=lavender))
            elif tag == 'ThemeRegionsChannels':
                set_colors(el, dict(back=pink, text=ink, text_selected=ui['button.foreground']))
            elif tag == 'ThemeRegionsScrubbing':
                set_colors(el, dict(back=lavender, text=ink, time_marker='#62447570', time_marker_selected='#C9559CCC'))
            elif tag == 'ThemeRegionsSidebars':
                set_colors(el, dict(back=pink, tab_back=lavender))
            elif tag == 'ThemeCommonAnim':
                set_colors(el, dict(playhead=strong_rose, preview_range='#B996E64D', channels='#F2E5FF80',
                    channels_sub='#FFE2F280', channel_group='#D6F5FF99', channel_group_active='#B4E9FFCC',
                    channel=pink, keyframe=ui['terminal.ansiYellow'], keyframe_selected=strong_rose,
                    keyframe_extreme=sy['strings'], keyframe_extreme_selected=ui['terminal.ansiRed'],
                    keyframe_breakdown=sy['numbers'], keyframe_breakdown_selected=purple,
                    keyframe_jitter=ui['terminal.ansiGreen'], keyframe_jitter_selected='#285D55',
                    keyframe_moving_hold=ink, keyframe_moving_hold_selected=rose,
                    keyframe_generated=ui['editorLineNumber.foreground'], keyframe_generated_selected=accent,
                    long_key='#62447570', long_key_selected='#C9559CB3'))
            elif tag == 'ThemeCommonCurves':
                set_colors(el, dict(handle_free=ui['terminal.ansiYellow'], handle_sel_free='#C68D32',
                    handle_auto=ui['terminal.ansiRed'], handle_sel_auto=strong_rose,
                    handle_vect=sy['numbers'], handle_sel_vect='#286087',
                    handle_align=ui['terminal.ansiGreen'], handle_sel_align='#285D55',
                    handle_auto_clamped=purple, handle_sel_auto_clamped=accent,
                    handle_vertex=ink, handle_vertex_select=strong_rose))
            elif tag == 'ThemeView3D':
                set_colors(el, dict(grid='#C9A5E650', grid_major='#A98EBC88', wire=ink, wire_edit=ink,
                    gp_wire_edit='#8B789880', gp_vertex=ink, gp_vertex_select=strong_rose,
                    text_grease_pencil=purple, object_selected=rose, object_active=strong_rose,
                    camera=ink, empty=ink, light='#99620E90', speaker=ink, vertex=ink,
                    vertex_select=strong_rose, vertex_unreferenced=sy['numbers'], edge_select=strong_rose,
                    edge_mode_select=purple, face='#62447512', face_select='#D66FA838', face_mode_select='#B996E64D',
                    face_retopology='#397DAD30', bevel=sy['numbers'], seam=ui['terminal.ansiRed'], sharp=ui['terminal.ansiCyan'],
                    crease=sy['strings'], normal=ui['terminal.ansiCyan'], vertex_normal=sy['numbers'], split_normal=purple,
                    bone_pose=sy['numbers'], bone_pose_active=strong_rose, bone_solid='#D3B9F2',
                    camera_path=purple, view_overlay=ink, transform=strong_rose))
            elif tag in ('ThemeGraphEditor', 'ThemeDopeSheet', 'ThemeNLAEditor', 'ThemeImageEditor', 'ThemeSequenceEditor', 'ThemeClipEditor'):
                set_colors(el, dict(grid=ui['panel.border'], vertex=ink, vertex_select=strong_rose, vertex_active=purple,
                    wire_edit=ink, edge_select=strong_rose, face='#62447512', face_select='#D66FA838',
                    keyframe_border=ink, keyframe_border_selected=ui['button.foreground'],
                    scope_back=blue, uv_shadow='#62447560', metadatabg=lavender, metadatatext=ink,
                    preview_back=pearl, active_strip=purple, selected_strip=strong_rose,
                    text_strip_cursor=rose, selected_text=soft_selected))
                if tag == 'ThemeNLAEditor':
                    set_colors(el, dict(strips='#D3B9F2', strips_selected=accent, transition_strips='#B4E9FF',
                        transition_strips_selected=sy['numbers'], meta_strips='#F7CDEC', meta_strips_selected=rose,
                        sound_strips='#A8D9CA', sound_strips_selected=ui['terminal.ansiGreen'],
                        active_action='#D66FA855', active_action_unset='#B996E633', tweak=ui['terminal.ansiGreen']))
                elif tag == 'ThemeClipEditor':
                    set_colors(el, dict(marker_outline=ink, marker=ui['terminal.ansiYellow'], active_marker=purple,
                        selected_marker=strong_rose, disabled_marker=ui['editorLineNumber.foreground'], locked_marker=sy['comments']))
            elif tag == 'ThemeTextEditor':
                set_colors(el, dict(line_numbers=ui['editorLineNumber.foreground'], line_numbers_background=lavender,
                    selected_text=soft_selected, cursor=rose, syntax_builtin=sy['functions'], syntax_symbols=sy['types'],
                    syntax_special=sy['types'], syntax_preprocessor=sy['keywords'], syntax_reserved=sy['keywords'],
                    syntax_comment=sy['comments'], syntax_string=sy['strings'], syntax_numbers=sy['numbers']))
            elif tag == 'ThemeNodeEditor':
                set_colors(el, dict(grid=ui['editorIndentGuide.background1'], node_selected=rose, node_active=strong_rose,
                    wire='#9B77B7FF', wire_inner=ui['editorLineNumber.foreground'], wire_select='#C9559CFF',
                    node_backdrop=pink, node_outline='#D9B9EBFF', input_node=sy['strings'], output_node=purple,
                    converter_node=sy['numbers'], color_node=ui['terminal.ansiYellow'], group_node=ui['terminal.ansiGreen'],
                    group_socket_node=ink, frame_node='#EBD5FFB3', matte_node=sy['strings'], distor_node=ui['terminal.ansiCyan'],
                    filter_node=sy['types'], vector_node=sy['types'], texture_node=ui['terminal.ansiYellow'],
                    shader_node=ui['terminal.ansiGreen'], script_node=sy['functions'], geometry_node=ui['terminal.ansiCyan'],
                    attribute_node=sy['numbers'], simulation_zone='#D66FA833', repeat_zone='#B996E633',
                    foreach_geometry_element_zone='#397DAD33', closure_zone='#357A7033'))
            elif tag == 'ThemeOutliner':
                set_colors(el, dict(match=rose, selected_highlight=selected, active=soft_selected,
                    selected_object=ink, active_object=ui['button.foreground'], edited_object='#D6F5FF80', row_alternate='#FFF9FF35'))
            elif tag == 'ThemeInfo':
                set_colors(el, {name: ink for name in el.attrib if name.endswith('_text')})
                set_colors(el, dict(info_selected=selected, info_debug=purple, info_property=ui['terminal.ansiGreen'], info_operator=sy['functions']))
            elif tag == 'ThemeConsole':
                set_colors(el, dict(line_output=sy['functions'], line_input=ink, line_info=ui['terminal.ansiGreen'],
                    line_error=ui['terminal.ansiRed'], cursor=rose, select=soft_selected))
            elif tag == 'ThemeProperties':
                set_colors(el, dict(match=selected))
            elif tag == 'ThemeSpreadsheet':
                set_colors(el, dict(row_alternate='#F2E5FF55'))
            elif tag == 'ThemeFontStyle':
                set_colors(el, dict(shadow='0', shadow_alpha='0'))
    # Normalize against the installed API: some bundled preset RGB fields still
    # contain an alpha byte left over from an older schema.
    for el in root.iter():
        if el.attrib:
            rna_type = getattr(bpy.types, el.tag)
            for name, value in list(el.attrib.items()):
                if value.startswith('#'):
                    length = rna_type.bl_rna.properties[name].array_length
                    el.set(name, value[:7] if length == 3 else value[:7] + (value[7:9] or 'ff'))
    # Collection, strip and bone color sets remain Blender's recognizable sets.
    ET.indent(tree, space='  ')
    filename = f'Cybercore_Cotton_Candy_{variant.title()}.xml'
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<!-- Cybercore Cotton Candy: ' + variant.title() + ' | CyberStudios | dream in pixels. create without limits. -->\n'
    xml += ET.tostring(root, encoding='unicode', short_empty_elements=False) + '\n'
    path = ROOT / filename
    path.write_text(xml, encoding='utf8')
    return path


def validate(path):
    xml_root = ET.parse(path).getroot()
    attributes = colors = 0
    for element in xml_root.iter():
        if not element.attrib:
            continue
        rna_type = getattr(bpy.types, element.tag)
        for name, value in element.attrib.items():
            prop = rna_type.bl_rna.properties.get(name)
            assert prop is not None, f'Unknown property: {element.tag}.{name}'
            attributes += 1
            if value.startswith('#'):
                assert prop.subtype == 'COLOR_GAMMA', (element.tag, name)
                assert len(value[1:]) == prop.array_length * 2, (element.tag, name, value, prop.array_length)
                int(value[1:], 16)
                colors += 1
    bpy.ops.preferences.reset_default_theme()
    messages = io.StringIO()
    with contextlib.redirect_stdout(messages):
        _rna_xml.xml_file_run(bpy.context, str(path), MENU.preset_xml_map, secure_types=MENU.preset_xml_secure_types)
    assert not messages.getvalue().strip(), messages.getvalue()
    with tempfile.TemporaryDirectory(prefix='cotton-theme-check-') as check_dir:
        roundtrip = pathlib.Path(check_dir) / (path.stem + '.xml')
        _rna_xml.xml_file_write(bpy.context, str(roundtrip), MENU.preset_xml_map)
        exported = ET.parse(roundtrip).getroot()
    # Blender stores theme bytes as floats; serializer truncation may differ by 1.
    def indexed_nodes(node, key=''):
        key += '/' + node.tag
        yield key, node
        counts = {}
        for child in node:
            index = counts.get(child.tag, 0)
            counts[child.tag] = index + 1
            yield from indexed_nodes(child, key + '[' + str(index) + ']')
    actual_nodes = dict(indexed_nodes(exported))
    for key, wanted in indexed_nodes(xml_root):
        assert key in actual_nodes, 'Round-trip lost node: ' + key
        actual = actual_nodes[key]
        for name, value in wanted.attrib.items():
            got = actual.get(name)
            if value.startswith('#'):
                a, b = bytes.fromhex(value[1:]), bytes.fromhex(got[1:])
                assert len(a) == len(b) and all(abs(x-y) <= 1 for x,y in zip(a,b)), (wanted.tag, name, value, got)
            else:
                assert got == value or (name.startswith('shadow') and float(got) == float(value)), (wanted.tag, name, value, got)
    return {'file': path.name, 'attributes_checked': attributes, 'colors_checked': colors,
            'import': 'passed', 'roundtrip': 'passed', 'warnings': []}


results = [validate(build(variant)) for variant in ('soft', 'vivid')]
report = {'blender_version': bpy.app.version_string, 'base_theme': 'Blender Light (installed factory preset)',
          'preferences_saved': False, 'results': results}
(ROOT / 'validation.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf8')
print(json.dumps(report, indent=2))

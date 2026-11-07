"""Build and validate the collection with Blender in background factory mode."""
import bpy
import _rna_xml
import contextlib
import hashlib
import io
import json
import pathlib
import tempfile
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
CATALOG = json.loads((ROOT / 'palettes.json').read_text(encoding='utf8'))
MENU = bpy.types.USERPREF_MT_interface_theme_presets
SYSTEM = pathlib.Path(bpy.utils.system_resource('SCRIPTS'))


def rgb(color):
    return tuple(int(color[i:i+2], 16) / 255 for i in (1, 3, 5))


def luminance(color):
    values = [(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4) for v in rgb(color)]
    return .2126 * values[0] + .7152 * values[1] + .0722 * values[2]


def contrast(a, b):
    x, y = sorted((luminance(a), luminance(b)))
    return (y + .05) / (x + .05)


def mix(a, b, amount):
    return '#' + ''.join(f'{round((x * (1-amount) + y * amount)*255):02X}' for x, y in zip(rgb(a), rgb(b)))


def readable(color, background, preferred):
    for step in range(101):
        candidate = mix(color, preferred, step / 100)
        if contrast(candidate, background) >= 4.5:
            return candidate
    raise AssertionError('Palette has insufficient text contrast')


def put(element, values):
    for name, value in values.items():
        if name not in element.attrib:
            continue
        prop = getattr(bpy.types, element.tag).bl_rna.properties[name]
        value = str(value)
        if value.startswith('#'):
            value = value[:7] if prop.array_length == 3 else value[:7] + (value[7:9] or 'FF')
        element.set(name, value)


def native_base(mode):
    bpy.ops.preferences.reset_default_theme()
    if mode == 'Light':
        _rna_xml.xml_file_run(bpy.context, str(SYSTEM / 'presets/interface_theme/Blender_Light.xml'), MENU.preset_xml_map, secure_types=MENU.preset_xml_secure_types)
    with tempfile.TemporaryDirectory(prefix='studio-theme-base-') as directory:
        file = pathlib.Path(directory) / 'base.xml'
        _rna_xml.xml_file_write(bpy.context, str(file), MENU.preset_xml_map)
        return ET.parse(file)


def build(theme):
    p = theme
    light = p['mode'] == 'Light'
    ink, paper, panel, head, field = (p[x] for x in ('ink', 'paper', 'panel', 'header', 'field'))
    accent, border, selected = (p[x] for x in ('accent', 'border', 'selection'))
    muted = readable(p['muted'], paper, ink)
    syntax = [readable(x, paper, ink) for x in p['syntax']]
    selected_ink = readable(ink, selected, '#17131E' if light else '#FFFFFF')
    field_ink = readable(ink, field, '#17131E' if light else '#FFFFFF')
    head_ink = readable(ink, head, '#17131E' if light else '#FFFFFF')
    axes = ['#AD3D50', '#28735A', '#356CA8'] if light else ['#EE8891', '#91C8A0', '#8FB9ED']
    red, green, blue = axes
    gold = '#8D651B' if light else '#E0C27C'
    cyan = '#287F88' if light else '#9AD9DE'
    purple = syntax[0]
    node_hues = [syntax[1], green, blue, gold, cyan, purple, syntax[4]]
    node_headers = [mix(panel, x, .28 if light else .22) for x in node_hues]
    for background in [paper, panel, head, field, selected, p['timeline'], *node_headers]:
        assert contrast(ink if background not in (selected, head, field) else selected_ink if background == selected else head_ink if background == head else field_ink, background) >= 4.5, (p['name'], background)
    tree = native_base(p['mode'])
    for section in tree.getroot().find('Theme'):
        bg = panel if section.tag in ('outliner', 'properties', 'preferences') else p['timeline'] if section.tag in ('graph_editor','dopesheet_editor','nla_editor','sequence_editor','console') else paper
        for el in section.iter():
            tag = el.tag
            if tag in ('ThemeSpaceGeneric', 'ThemeSpaceGradient'):
                put(el, dict(back=bg, title=ink, text=ink, text_hi=ink, header=head, header_text=head_ink, header_text_hi=head_ink))
            elif tag == 'ThemeGradientColors':
                put(el, dict(background_type='SINGLE_COLOR', high_gradient=paper, gradient=paper))
            elif tag == 'ThemeUserInterface':
                put(el, dict(widget_emboss=ink+'10', editor_border=border, editor_outline=border, editor_outline_active=accent,
                    widget_text_cursor=accent, panel_header=head, panel_title=head_ink, panel_text=ink, panel_back=panel,
                    panel_sub_back=field+'A0', panel_outline=border+'80', transparent_checker_primary=panel,
                    transparent_checker_secondary=paper, axis_x=red, axis_y=green, axis_z=blue, axis_w=purple,
                    gizmo_hi=accent, gizmo_primary=gold, gizmo_secondary=cyan, gizmo_view_align=accent, gizmo_a=green, gizmo_b=red,
                    icon_alpha='1', icon_saturation='1', icon_scene=purple, icon_collection=muted, icon_object=accent,
                    icon_object_data=green, icon_modifier=blue, icon_shading=syntax[1], icon_folder=gold, icon_autokey=red))
                for key, value in list(el.attrib.items()):
                    if 'text' in key and value.startswith('#'):
                        put(el, {key: ink if 'cursor' not in key else accent})
            elif tag == 'ThemeWidgetColors':
                put(el, dict(outline=border, outline_sel=accent, inner=field, inner_sel=selected, item=accent,
                    text=field_ink, text_sel=selected_ink, show_shaded='FALSE', shadetop='0', shadedown='0', roundness='.4'))
            elif tag == 'ThemeWidgetStateColors':
                put(el, dict(error=mix(panel,red,.3), warning=mix(panel,gold,.3), info=mix(panel,blue,.3), success=mix(panel,green,.3),
                    inner_anim=mix(panel,green,.28), inner_anim_sel=mix(panel,green,.42), inner_key=mix(panel,gold,.28),
                    inner_key_sel=mix(panel,gold,.42), inner_driven=mix(panel,purple,.28), inner_driven_sel=mix(panel,purple,.42),
                    inner_overridden=mix(panel,cyan,.28), inner_overridden_sel=mix(panel,cyan,.42),
                    inner_changed=mix(panel,accent,.28), inner_changed_sel=mix(panel,accent,.42)))
            elif tag == 'ThemeRegionsAssetShelf':
                put(el, dict(back=panel, header_back=head))
            elif tag == 'ThemeRegionsChannels':
                put(el, dict(back=panel, text=ink, text_selected=selected_ink))
            elif tag == 'ThemeRegionsScrubbing':
                put(el, dict(back=head, text=head_ink, time_marker=muted+'80', time_marker_selected=accent+'FF'))
            elif tag == 'ThemeRegionsSidebars':
                put(el, dict(back=panel, tab_back=head))
            elif tag == 'ThemeCommonAnim':
                put(el, dict(playhead=accent, preview_range=accent+'40', channels=panel+'80', channels_sub=field+'80',
                    channel_group=mix(panel,green,.15)+'90', channel_group_active=mix(panel,green,.25)+'B0', channel=panel,
                    keyframe=gold, keyframe_selected=accent, keyframe_extreme=red, keyframe_extreme_selected=syntax[1],
                    keyframe_breakdown=blue, keyframe_breakdown_selected=purple, keyframe_jitter=green,
                    keyframe_jitter_selected=cyan, keyframe_moving_hold=muted, keyframe_moving_hold_selected=accent,
                    keyframe_generated=muted, keyframe_generated_selected=accent, long_key=muted+'80', long_key_selected=accent+'B3'))
            elif tag == 'ThemeCommonCurves':
                put(el, dict(handle_free=gold, handle_sel_free=accent, handle_auto=red, handle_sel_auto=syntax[1],
                    handle_vect=blue, handle_sel_vect=cyan, handle_align=green, handle_sel_align=syntax[3],
                    handle_auto_clamped=purple, handle_sel_auto_clamped=syntax[4], handle_vertex=ink, handle_vertex_select=accent))
            elif tag == 'ThemeView3D':
                put(el, dict(grid=p['grid']+'75', grid_major=p['grid']+'B0', wire=ink, wire_edit=ink, gp_wire_edit=muted+'80',
                    gp_vertex=ink, gp_vertex_select=accent, text_grease_pencil=purple, object_selected=mix(accent,paper,.25),
                    object_active=accent, camera=muted, empty=muted, light=gold+'90', speaker=muted, vertex=ink,
                    vertex_select=accent, vertex_unreferenced=blue, edge_select=accent, edge_mode_select=purple,
                    face=ink+'12', face_select=accent+'45', face_mode_select=accent+'50', face_retopology=blue+'30',
                    bevel=blue, seam=red, sharp=cyan, crease=purple, normal=cyan, vertex_normal=blue,
                    split_normal=purple, bone_pose=blue, bone_pose_active=accent, bone_solid=border,
                    camera_path=accent, view_overlay=ink, transform=accent, object_origin_size='6'))
            elif tag in ('ThemeGraphEditor','ThemeDopeSheet','ThemeNLAEditor','ThemeImageEditor','ThemeSequenceEditor','ThemeClipEditor'):
                put(el, dict(grid=p['grid'], vertex=ink, vertex_select=accent, vertex_active=ink, wire_edit=ink,
                    edge_select=accent, face=ink+'12', face_select=accent+'45', scope_back=panel, uv_shadow=muted+'60',
                    keyframe_border=ink, keyframe_border_selected=ink, metadatabg=head, metadatatext=head_ink,
                    preview_back=paper, active_strip=accent, selected_strip=accent, text_strip_cursor=accent, selected_text=selected))
                if tag == 'ThemeNLAEditor':
                    put(el, dict(strips=border, strips_selected=accent, transition_strips=mix(panel,blue,.4),
                        transition_strips_selected=blue, meta_strips=mix(panel,purple,.4), meta_strips_selected=purple,
                        sound_strips=mix(panel,green,.4), sound_strips_selected=green, active_action=accent+'66', active_action_unset=border+'4D'))
                elif tag == 'ThemeSequenceEditor':
                    put(el, dict(movie_strip=node_headers[2], movieclip_strip=node_headers[0], image_strip=node_headers[3],
                        scene_strip=node_headers[1], audio_strip=node_headers[4], effect_strip=node_headers[5],
                        transition_strip=node_headers[6], color_strip=border, meta_strip=node_headers[5],
                        mask_strip=node_headers[0], text_strip=node_headers[6], row_alternate=ink+'0D'))
                elif tag == 'ThemeClipEditor':
                    put(el, dict(marker_outline=ink, marker=gold, active_marker=accent, selected_marker=accent, disabled_marker=muted, locked_marker=border))
            elif tag == 'ThemeTextEditor':
                put(el, dict(line_numbers=muted, line_numbers_background=panel, selected_text=selected, cursor=accent,
                    syntax_builtin=syntax[3], syntax_symbols=syntax[4], syntax_special=syntax[4], syntax_preprocessor=syntax[0],
                    syntax_reserved=syntax[0], syntax_comment=syntax[5], syntax_string=syntax[1], syntax_numbers=syntax[2]))
            elif tag == 'ThemeNodeEditor':
                put(el, dict(grid=p['grid'], node_selected=mix(accent,paper,.25), node_active=accent, wire=border, wire_inner=muted,
                    wire_select=accent, node_backdrop=panel, node_outline=border,
                    input_node=node_headers[0], output_node=node_headers[5], converter_node=node_headers[2], color_node=node_headers[3],
                    group_node=node_headers[1], group_socket_node=head, frame_node=panel+'CC', matte_node=node_headers[0],
                    distor_node=node_headers[4], filter_node=node_headers[6], vector_node=node_headers[6], texture_node=node_headers[3],
                    shader_node=node_headers[1], script_node=node_headers[2], geometry_node=node_headers[4], attribute_node=node_headers[2],
                    simulation_zone=syntax[1]+'30', repeat_zone=gold+'30', foreach_geometry_element_zone=blue+'30', closure_zone=green+'30'))
            elif tag == 'ThemeOutliner':
                put(el, dict(match=accent, selected_highlight=selected, active=selected, selected_object=selected_ink,
                    active_object=selected_ink, edited_object=accent+'45', row_alternate=ink+'09'))
            elif tag == 'ThemeInfo':
                put(el, {name: ink for name in el.attrib if name.endswith('_text')})
                put(el, dict(info_selected=selected, info_debug=purple, info_property=green, info_operator=blue))
            elif tag == 'ThemeConsole':
                put(el, dict(line_output=readable(blue,bg,ink), line_input=ink, line_info=readable(green,bg,ink),
                    line_error=readable(red,bg,ink), cursor=accent, select=selected))
            elif tag == 'ThemeProperties':
                put(el, dict(match=selected))
            elif tag == 'ThemeSpreadsheet':
                put(el, dict(row_alternate=ink+'0B'))
            elif tag == 'ThemeFontStyle':
                put(el, dict(shadow='0', shadow_alpha='0'))
    # Choose widget surfaces by role after the generic widget mapping.
    ui = tree.getroot().find('Theme/user_interface/ThemeUserInterface')
    for node in ui:
        widget = node.find('ThemeWidgetColors')
        if widget is not None:
            surface = head if node.tag in ('wcol_tool','wcol_radio','wcol_toggle','wcol_tab') else panel if node.tag in ('wcol_menu_back','wcol_menu','wcol_pulldown','wcol_toolbar_item') else field
            put(widget, dict(inner=surface, text=readable(ink,surface,ink)))
            if node.tag == 'wcol_progress':
                put(widget, dict(inner=field, item=accent))
            elif node.tag == 'wcol_scroll':
                put(widget, dict(inner=paper, item=border))
    ET.indent(tree, space='  ')
    name = p['name'].replace(' ', '_') + '.xml'
    folder = ROOT / p['folder']
    folder.mkdir(parents=True, exist_ok=True)
    file = folder / name
    header = '<?xml version="1.0" encoding="UTF-8"?>\n<!-- '+p['name']+' | CyberStudios | dream in pixels. create without limits. | SPDX-License-Identifier: MIT -->\n'
    file.write_text(header + ET.tostring(tree.getroot(), encoding='unicode', short_empty_elements=False) + '\n', encoding='utf8')
    return file, {'primary_text': round(contrast(ink,paper),2), 'panel_text': round(contrast(ink,panel),2),
        'header_text': round(contrast(head_ink,head),2), 'field_text': round(contrast(field_ink,field),2),
        'selected_text': round(contrast(selected_ink,selected),2), 'syntax_minimum': round(min(contrast(c,paper) for c in syntax),2),
        'node_header_minimum': round(min(contrast(ink,c) for c in node_headers),2)}


def validate(file):
    wanted = ET.parse(file).getroot()
    attributes = colors = 0
    for element in wanted.iter():
        if element.attrib:
            rna = getattr(bpy.types, element.tag).bl_rna
            for name, value in element.attrib.items():
                prop = rna.properties.get(name)
                assert prop is not None, (element.tag, name)
                attributes += 1
                if value.startswith('#'):
                    assert prop.subtype == 'COLOR_GAMMA' and len(value[1:]) == prop.array_length*2, (element.tag,name)
                    int(value[1:],16)
                    colors += 1
    bpy.ops.preferences.reset_default_theme()
    messages = io.StringIO()
    with contextlib.redirect_stdout(messages):
        _rna_xml.xml_file_run(bpy.context, str(file), MENU.preset_xml_map, secure_types=MENU.preset_xml_secure_types)
    assert not messages.getvalue().strip(), messages.getvalue()
    with tempfile.TemporaryDirectory(prefix='studio-theme-check-') as directory:
        exported_file = pathlib.Path(directory) / 'check.xml'
        _rna_xml.xml_file_write(bpy.context, str(exported_file), MENU.preset_xml_map)
        exported = ET.parse(exported_file).getroot()
    def walk(node, key=''):
        key += '/' + node.tag
        yield key, node
        counts = {}
        for child in node:
            index = counts.get(child.tag, 0)
            counts[child.tag] = index + 1
            yield from walk(child, key+'['+str(index)+']')
    actual = dict(walk(exported))
    for key, node in walk(wanted):
        assert key in actual, 'Missing round-trip node '+key
        for name, value in node.attrib.items():
            got = actual[key].get(name)
            if value.startswith('#'):
                a,b = bytes.fromhex(value[1:]),bytes.fromhex(got[1:])
                assert len(a)==len(b) and all(abs(x-y)<=1 for x,y in zip(a,b)), (key,name,value,got)
            else:
                assert got==value or (got is not None and value.replace('.','',1).lstrip('-').isdigit() and float(got)==float(value)), (key,name,value,got)
    return {'file':file.relative_to(ROOT).as_posix(),'attributes_checked':attributes,'colors_checked':colors,'import':'passed','roundtrip':'passed','warnings':[]}


results = []
for theme in CATALOG['themes']:
    file, ratios = build(theme)
    result = validate(file)
    result['name'] = theme['name']
    result['contrast_ratios'] = ratios
    result['sha256'] = hashlib.sha256(file.read_bytes()).hexdigest()
    results.append(result)
    print(theme['name'] + ': import, round-trip, and text contrast passed')
for file in sorted((ROOT/'cybercore cotton candy').glob('*.xml')):
    result = validate(file)
    result['name'] = 'Cotton Candy '+('Soft' if 'Soft' in file.name else 'Vivid')
    result['sha256'] = hashlib.sha256(file.read_bytes()).hexdigest()
    results.append(result)
report = {'blender_version':bpy.app.version_string,'preferences_saved':False,'results':results,
          'limits':'Native XML import/export and palette contrast checks; interface preview illustrations are not Blender screenshots.'}
(ROOT/'validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
print(json.dumps({'themes_checked':len(results),'blender_version':bpy.app.version_string,'colors_per_theme':[r['colors_checked'] for r in results]},indent=2))

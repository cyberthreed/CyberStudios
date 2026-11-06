const headings = {
  'Install': '💾 bring it to your desktop',
  'Inside the theme': '✧ inside this little workspace',
  'Make it yours': '🎀 make it yours',
  'Package locally': '💿 package your copy',
  'Preview notes': '☁️ a little preview note',
  'License': '♡ the small print'
};

/** Brand documentation without changing code samples or the theme's chosen palette. */
export function brandThemeReadme(theme, markdown) {
  let fenced = false;
  const lines = markdown.split('\n').map(line => {
    if (line.startsWith('```')) { fenced = !fenced; return line; }
    if (fenced) return line;
    if (line === '# ' + theme.name) {
      return `# ♡ ${theme.name.toLowerCase()} ✧\n\n**\`cyberstudios / theme.library / ${theme.slug}\`**`;
    }
    if (line === '> dream in pixels. create without limits.') {
      return '**`dream in pixels. create without limits.`**\n\n☁️　♡　💿　✧';
    }
    if (line.startsWith('## ')) return '## ' + (headings[line.slice(3)] || line.slice(3).toLowerCase());
    return line;
  });
  return lines.join('\n')
  .replace('The folder can be used as its own GitHub repository whenever you are ready. ', 'The source is included in the CyberStudios VS Code theme collection. ')
  .replace('as the local publisher namespace', 'as the extension publisher namespace')
  .replace('Set the repository URL after you create your repository.', 'The repository URL points to CyberStudios, with this theme\'s folder recorded in the manifest.')
  .replace(
    'MIT. Made by [CyberStudios](https://github.com/cyberthreed).',
    'MIT. Made by [CyberStudios](https://github.com/cyberthreed/CyberStudios).\n\n*made of pixels, daydreams & too many open tabs.* ♡'
  );
}

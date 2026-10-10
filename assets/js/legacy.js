const paths = {
  prj_01: 'obsidian-tower',
  prj_02: 'aura-pavilion',
  prj_03: 'zenith-residence',
  prj_04: 'lumina-museum',
};
const slug = paths[new URLSearchParams(location.search).get('id')];
if (slug) location.replace(`${slug}.html`);

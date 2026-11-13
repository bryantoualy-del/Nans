/* Presentation adapters for controls injected by the shared companion scripts. */
(() => {
  const icon = name => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    svg.setAttribute('class', 'nans-icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    use.setAttribute('href', 'assets/nans-icons.svg#' + name);
    svg.append(use);
    return svg;
  };

  function decorate(selector, name) {
    const node = document.querySelector(selector);
    if (node) node.prepend(icon(name));
  }

  const combat = document.querySelector('#combat');
  const navigation = document.querySelector('nav.tabs');
  const sections = combat.querySelector('.combat-tabs');
  const group = navigation.querySelector('[data-rpg-group-tab]');
  const tools = combat.querySelector('.rpg-combat-tools');
  const wide = window.matchMedia('(min-width: 1024px)');
  function placeNavigation() {
    if (wide.matches) {
      navigation.insertBefore(sections, group);
      if (tools) navigation.insertBefore(tools, group);
    } else {
      combat.prepend(sections);
      if (tools) sections.before(tools);
    }
  }
  placeNavigation();
  wide.addEventListener('change', placeNavigation);

  decorate('[data-v3-tab=social]', 'ancestors');
  decorate('[data-v3-tab=notes]', 'book');
  decorate('nav.tabs [data-rpg-group-tab]', 'ancestors');
  decorate('[data-opportunity]', 'target');
  decorate('#chargeOnlyBtn', 'sword');
  decorate('#chargeAxeBtn', 'axe');
  decorate('.charge-reset', 'bin');

  for (const [id, mode] of [['swordName', 'sword'], ['axeName', 'axe']]) {
    document.getElementById(id).addEventListener('click', () => {
      if (window.__CompanionBridge.read().mode !== mode) document.getElementById('modeSwitch').click();
    });
  }

  const turnIcons = {
    round: 'hourglass', action: 'swords', bonus: 'plus', reaction: 'bolt',
    move: 'run', damage: 'impact', conc: 'eye', next: 'next'
  };
  document.addEventListener('DOMContentLoaded', () => {
    for (const [slot, name] of Object.entries(turnIcons)) {
      document.querySelector('.cc-turn-' + slot + ' .cc-turn-icon')?.replaceChildren(icon(name));
    }
    document.querySelectorAll('.cc-turn-rest .cc-turn-icon').forEach((node, index) => {
      node.replaceChildren(icon(index === 0 ? 'hourglass' : 'moon'));
    });
  });
})();

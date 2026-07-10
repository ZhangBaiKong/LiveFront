/* LiveFront DOM 工具函数 */
window.LiveFront = window.LiveFront || {};

LiveFront.DOM = {
  $(selector, parent) { return (parent || document).querySelector(selector); },
  $$(selector, parent) { return Array.from((parent || document).querySelectorAll(selector)); },

  el(tag, attrs, children) {
    const elem = document.createElement(tag);
    if (attrs) {
      for (const [key, val] of Object.entries(attrs)) {
        if (key === 'class' || key === 'className') elem.className = val;
        else if (key === 'style' && typeof val === 'object') Object.assign(elem.style, val);
        else if (key.startsWith('on') && typeof val === 'function') elem.addEventListener(key.slice(2).toLowerCase(), val);
        else if (key === 'innerHTML') elem.innerHTML = val;
        else if (key === 'textContent') elem.textContent = val;
        else elem.setAttribute(key, val);
      }
    }
    if (children) {
      if (typeof children === 'string') elem.textContent = children;
      else if (Array.isArray(children)) children.forEach(c => { if (c) elem.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
      else elem.appendChild(children);
    }
    return elem;
  },

  html(container, html) { container.innerHTML = html; },

  on(el, event, handler, options) { el.addEventListener(event, handler, options); return () => el.removeEventListener(event, handler, options); },

  show(el) { el.classList.remove('hidden'); },
  hide(el) { el.classList.add('hidden'); },
  toggle(el, force) { el.classList.toggle('hidden', force === undefined ? undefined : !force); }
};

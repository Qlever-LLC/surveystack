import marked from 'http://localhost:8081/marked.esm.js';

export function card(content, { header, meta, footer }) {
  const node = document.createElement('div');
  // node.className = 'max-w-sm rounded overflow-hidden shadow-lg';
  node.className = 'card shadow';

  node.innerHTML = `
    <div class="px-4 py-4">
      ${header ? `<div class="font-bold text-xl mb-2">
        ${header}
      </div>` : ''}
      ${meta ? `<div class="text-gray-600 -mt-2 mb-2">
        ${meta}
      </div>` : ''}
      <p class="text-gray-700 text-base">
        ${content}
      </p>
      ${footer ? `<div class="text-gray-700">
        ${footer}
      </div>` : ''}
    </div>
  `;
  return node;
}


export function message(content, { type = null, header }) {
  const node = document.createElement('div');
  node.className = 'message shadow';
  switch (type) {
    case 'warning':
      node.classList.add('warning');
      break;
    case 'success':
      node.classList.add('success');
      break;
    case 'negative':
    case 'error':
    case 'failure':
      node.classList.add('error');
      break;
    case 'info':
      node.classList.add('info');
      break;
    default:
      break;
  }
  node.innerHTML = `
    ${header ? `<div class="header font-bold text-xl">${header}</div>` : ''}
    <div class="content">${content}</div>
  `;
  return node;
}

export function text(content) {
  const node = document.createElement('p');
  node.className = 'text-gray-700 text-base';
  node.innerHTML = content;
  return node;
}

export function markdown(content) {
  const node = document.createElement('div');
  node.innerHTML = marked(content);
  return node;
}


export function createUI() {
  return {
    node: document.createElement('div'),
    text,
    message,
    card,
    markdown,
    add(...elements) {
      elements.forEach(el => this.node.appendChild(el));
    },
  };
}

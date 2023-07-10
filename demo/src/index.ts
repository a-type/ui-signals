import {
  css,
  atom,
  child,
  prop,
  element,
  define,
  attr,
  AttrOf,
} from '../../src/index.js';

const app = element('div');
child(app, atom('text', 'Hello world!'));
prop(app, 'className', atom('class', 'demo'));

const body = element(document.body);
child(body, app);

const color = atom('color', 'red');
setInterval(() => {
  color.set(color.value === 'red' ? 'green' : 'red');
}, 1000);

child(
  body,
  css`
    .demo {
      color: ${color};
    }
  `,
);

const Custom = define(
  'c-custom',
  {
    content: 'Hello world!',
  },
  ({ ui, css, attrs }) => {
    const root = ui(element('div'));
    child(root, attrs.content);
    prop(root, 'className', atom('class', 'demo'));

    css`
      .demo {
        color: blue;
      }
    `;
  },
);

const custom = element(Custom);
child(body, custom);

const customContent = atom('customContent', 'Hello world 1');
attr(custom, 'content', customContent);

let i = 1;
setInterval(() => {
  customContent.set(`Hello world ${++i}`);
}, 2000);

import {
  css,
  atom,
  child,
  prop,
  element,
  define,
  attr,
  AttrOf,
  computed,
  react,
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

const Custom = define<{ counter: number }>('c-custom', (props, { ui, css }) => {
  const root = ui(element('div'));
  child(
    root,
    computed('display', () => `Counter: ${props.counter}`),
  );
  prop(root, 'className', atom('class', 'demo'));

  css`
    .demo {
      color: blue;
    }
  `;
});

const counter = atom('counter', 0);

const custom = Custom({
  counter,
});
child(body, custom);

setInterval(() => {
  counter.update((i) => ++i);
}, 2000);

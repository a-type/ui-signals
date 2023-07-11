import { DomSignal, child, element } from './html.js';
import { css } from './css.js';
import { Atom, Signal, atom } from 'signia';

interface InitializerTools {
  ui: <T extends DomSignal>(element: T) => T;
  css: typeof css;
}

export type Initializer<Props extends Record<string, any>> = (
  props: Props,
  tools: InitializerTools,
) => void;

export type AttrSignals<Attrs extends Record<string, string>> = {
  [K in keyof Attrs]: Atom<Attrs[K]>;
};

type SignalGetters<T extends Record<string, Signal<any>>> = {
  [K in keyof T]: T[K] extends Signal<infer U> ? U : never;
};

type MappedToSignals<T extends Record<string, any>> = {
  [K in keyof T]: Signal<T[K]>;
};

function asGetters<T extends Record<string, Signal<any>>>(
  obj: T,
): SignalGetters<T> {
  const getters: Record<string, any> = {};
  for (const key in obj) {
    Object.defineProperty(getters, key, {
      get() {
        return obj[key].value;
      },
      configurable: true,
      enumerable: true,
    });
  }
  return getters as any;
}

export const define = <
  Props extends Record<string, any> = Record<string, never>,
  Attrs extends Record<string, string> = Record<string, never>,
>(
  name: string,
  init: Initializer<Props>,
  attrs: Attrs = {} as any,
) => {
  if (customElements.get(name)) return;
  class Component extends HTMLElement {
    private root: DomSignal<ShadowRoot>;
    readonly attrs: AttrSignals<Attrs>;
    readonly props: Props;

    static get observedAttributes() {
      return Object.keys(attrs);
    }

    constructor(props: MappedToSignals<Props>) {
      super();
      const shadowRoot = this.attachShadow({ mode: 'open' });
      this.root = element(shadowRoot);
      this.attrs = Object.fromEntries(
        Object.entries(attrs).map(([key, value]) => {
          return [key, atom(key, value)];
        }),
      ) as unknown as AttrSignals<Attrs>;
      this.props = asGetters(props) as any;
    }

    // lifecycle
    connectedCallback() {
      init(this.props, {
        ui: this.ui,
        css: this.css,
      });
    }

    disconnectedCallback() {
      this.root.value.innerHTML = '';
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
      if (this.attrs[name]) {
        // FIXME: this is avoiding the 'cannot set atoms in a reaction' error
        requestAnimationFrame(() => {
          // any cast: idk, strings are strings.
          this.attrs[name].set(newValue as any);
        });
      }
    }

    // tools
    ui = <T extends DomSignal>(element: T) => {
      return child(this.root, element);
    };
    css = (
      strings: TemplateStringsArray,
      ...interpolations: (string | Signal<string>)[]
    ) => {
      const style = css(strings, ...interpolations);
      child(this.root, style);
      return style;
    };
  }
  customElements.define(name, Component);

  return (props: MappedToSignals<Props>) => {
    const instance = new Component(props);
    const el = element(instance);
    return el;
  };
};

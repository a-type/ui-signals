import { DomSignal, child, element } from './html.js';
import { css } from './css.js';
import { Atom, Signal, atom } from 'signia';

interface InitializerTools<Attrs extends Record<string, string>> {
  ui: <T extends DomSignal>(element: T) => T;
  css: typeof css;
  attrs: {
    [K in keyof Attrs]: Signal<Attrs[K]>;
  };
}

export type Initializer<Attrs extends Record<string, string>> = (
  tools: InitializerTools<Attrs>,
) => void;

export type CustomElementManifest<
  Name extends `${string}-${string}`,
  Attrs extends Record<string, string>,
> = {
  attrs: Attrs;
  name: Name;
};

export type AttrSignals<Attrs extends Record<string, string>> = {
  [K in keyof Attrs]: Atom<Attrs[K]>;
};

export const define = <
  Name extends `${string}-${string}`,
  Attrs extends Record<string, string> = Record<string, never>,
>(
  name: Name,
  attrs: Attrs,
  init: Initializer<Attrs>,
): CustomElementManifest<Name, Attrs> => {
  if (customElements.get(name)) return;
  customElements.define(
    name,
    class extends HTMLElement {
      private root: DomSignal<ShadowRoot>;
      readonly attrs: AttrSignals<Attrs>;

      static get observedAttributes() {
        return Object.keys(attrs);
      }

      constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        this.root = element(shadowRoot);
        this.attrs = Object.fromEntries(
          Object.entries(attrs).map(([key, value]) => {
            return [key, atom(key, value)];
          }),
        ) as unknown as AttrSignals<Attrs>;
      }

      // lifecycle
      connectedCallback() {
        init({
          ui: this.ui,
          css: this.css,
          attrs: this.attrs,
        });
      }

      disconnectedCallback() {
        this.root.value.innerHTML = '';
      }

      attributeChangedCallback(
        name: string,
        oldValue: string,
        newValue: string,
      ) {
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
    },
  );

  return {
    name,
    attrs,
  };
};

export function isCustomElementManifest<
  Name extends `${string}-${string}`,
  Attrs extends Record<string, string>,
>(value: any): value is CustomElementManifest<Name, Attrs> {
  return value?.name && value?.attrs;
}

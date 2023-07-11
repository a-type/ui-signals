import { react, Signal, atom, RESET_VALUE } from 'signia';
import { AttrSignals } from './define.js';

export type DomSignal<
  T extends HTMLElement | DocumentFragment = HTMLElement | DocumentFragment,
> = Signal<T, { value: T }>;

type TagName = keyof HTMLElementTagNameMap;
type CustomTagName = `${string}-${string}`;

type FromNameOrInit<T> = T extends TagName
  ? HTMLElementTagNameMap[T]
  : T extends HTMLElement
  ? T
  : T extends DocumentFragment
  ? T
  : HTMLElement;

export const element = <
  T extends TagName | HTMLElement | DocumentFragment | CustomTagName,
>(
  tagNameOrValue: T,
): DomSignal<FromNameOrInit<T>> => {
  const name =
    typeof tagNameOrValue === 'string'
      ? tagNameOrValue
      : tagNameOrValue instanceof HTMLElement
      ? tagNameOrValue.tagName.toLowerCase()
      : 'fragment';
  const instance = atom(
    name,
    typeof tagNameOrValue === 'string'
      ? (document.createElement(tagNameOrValue) as T)
      : tagNameOrValue,
    {
      historyLength: 1,
      computeDiff(prev) {
        return { value: prev };
      },
    },
  );
  react('element unmount', (lastChanged) => {
    const diffs = instance.getDiffSince(lastChanged);
    if (diffs === RESET_VALUE) return;
    const el = diffs[0]?.value;
    if (el instanceof HTMLElement) {
      el.remove();
    }
  });
  return instance as any;
};

export const div = element.bind(null, 'div');

export const child = <T extends DomSignal | Signal<string>>(
  parent: DomSignal,
  child: T,
) => {
  react('child', (lastChanged) => {
    const diffs = parent.getDiffSince(lastChanged);
    const parentEl = parent.value;
    if (diffs !== RESET_VALUE) {
      diffs.forEach((diff) => {
        const childEl = diff.value;
        if (childEl) {
          parentEl.appendChild(childEl);
        }
      });
    }
    if (!parentEl) return;
    const childEl = child.value;
    if (typeof childEl === 'string') {
      if (parentEl instanceof HTMLElement) parentEl.innerText = childEl;
      else if (parentEl instanceof DocumentFragment) {
        parentEl.textContent = childEl;
      }
    } else {
      parentEl.appendChild(childEl);
    }
  });
  return child;
};

export const prop = <
  T extends HTMLElement | DocumentFragment,
  K extends keyof T,
>(
  element: DomSignal<T>,
  key: K,
  value: Signal<T[K]>,
) => {
  react('prop', () => {
    const el = element.value;
    if (!el) return;
    el[key] = value.value;
  });
};

export type AttrOf<T extends HTMLElement> = T extends { attrs: infer U }
  ? keyof U
  : string;
export const attr = <T extends HTMLElement, K extends AttrOf<T>>(
  element: DomSignal<T>,
  key: K,
  value: Signal<string>,
) => {
  react('attr', () => {
    const el = element.value;
    if (!el) return;
    el.setAttribute(key as string, value.value as any);
  });
};

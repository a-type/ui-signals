import { Signal, computed } from 'signia';
import { child, element } from './html.js';

/**
 * A tagged template literal which interpolates
 * strings or Signal<string>s into a single
 * stylesheet.
 */
export const css = (
  strings: TemplateStringsArray,
  ...interpolations: (string | Signal<string>)[]
) => {
  const style = element('style');
  child(
    style,
    computed('style content', () => {
      let result = '';
      for (let i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i < interpolations.length) {
          const interpolation = interpolations[i];
          result +=
            typeof interpolation === 'string'
              ? interpolation
              : interpolation.value;
        }
      }
      return result;
    }),
  );
  return style;
};

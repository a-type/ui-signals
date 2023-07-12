import {
  ComputedOptions,
  atom as baseAtom,
  computed as baseComputed,
  react as baseReact,
} from 'signia';

export function atom<T>(initial: T, name?: string) {
  return baseAtom(name ?? 'atom', initial);
}

export function computed<T, Diff>(
  compute: (previousValue: T, lastComputedEpoch: number) => T,
  options: ComputedOptions<T, Diff> & { name?: string } = {},
) {
  return baseComputed(options.name ?? 'computed', compute, options);
}

export function react(
  callback: (lastChanged: number) => void,
  options: {
    scheduleEffect?: (execute: () => void) => void;
    name?: string;
  } = {},
) {
  return baseReact(options.name ?? 'react', callback, options);
}

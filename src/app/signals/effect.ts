import { Signal } from 'signal-polyfill';

/*
Creating a simple effect https://github.com/tc39/proposal-signals/issues/212
- You can use Signal.subtle.Watch(callback) combined with Signal.Computed(callback) to create a simple effect implementation.
- The Signal.subtle.Watch callback is invoked synchronously when a watched signal becomes dirty.
- To batch effect updates, library authors are expected to implement their own schedulers.
- Use Signal.subtle.Watch#getPending() to retrieve an array of dirty signals.
- Calling Signal.subtle.Watch#watch() with no arguments will re-watch the list of tracked signals again.
*/

let needsEnqueue = true;

const w = new Signal.subtle.Watcher(() => {
  if (needsEnqueue) {
    needsEnqueue = false;
    queueMicrotask(processPending);
  }
});

function processPending() {
  needsEnqueue = true;

  for (const s of w.getPending()) {
    s.get();
  }

  w.watch();
}

type CleanUp = () => void;
/* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
export function effect(callback: () => void | CleanUp): CleanUp {
  /* eslint-disable-next-line @typescript-eslint/no-invalid-void-type */
  let cleanup: void | (() => void);

  const computed = new Signal.Computed(() => {
    if (typeof cleanup === 'function') cleanup();
    cleanup = callback();
  });

  w.watch(computed);
  computed.get();

  return () => {
    w.unwatch(computed);
    if (typeof cleanup === 'function') cleanup();
  };
}

/* Example Usage:
import { Signal } from 'signal-polyfill';
import { effect } from './effect';

const counter = new Signal.State(0);
const isEven = new Signal.Computed(() => (counter.get() & 1) == 0);
const parity = new Signal.Computed(() => (isEven.get() ? 'even' : 'odd'));

effect(() => console.log(parity.get())); // Console logs "even" immediately.
setInterval(() => counter.set(counter.get() + 1), 1000); // Changes the counter every 1000ms.

// effect triggers console log "odd"
// effect triggers console log "even"
// effect triggers console log "odd"
// ...


function color() {
  // value: string) {
  // this is the decorator factory, it sets up
  // the returned decorator function
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    // this is the decorator
    // do something with 'target' and 'value'...
  };
}

export class Counter {
  @color() private val: number = 0;

  get value() {
    return this.val;
  }

  increment() {
    this.val++;
  }

  decrement() {
    if (this.val > 0) {
      this.val--;
    }
  }
}
*/

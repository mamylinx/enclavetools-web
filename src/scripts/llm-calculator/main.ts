import { populateCatalog } from './step5';
import { bindEvents } from './events';
import { goStep } from './nav';

/** Entry point: build the catalog, wire events, and show step 1. */
populateCatalog();
bindEvents();
goStep(1);

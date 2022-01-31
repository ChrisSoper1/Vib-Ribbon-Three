/**
 * This is the entrypoint for the module.  For now lets avoid doing stuff in here directly,
 * and instead reference outside from here.
 */
import {VibRibbonApplication} from './day2';

const app = new VibRibbonApplication();
app.start();
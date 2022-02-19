/**
 * This is the entrypoint for the module.  For now lets avoid doing stuff in here directly,
 * and instead reference outside from here.
 */
import {VibRibbonApplication} from './day2';
// const app = new VibRibbonApplication();

// const audioFile = './Sam_and_Dave-Hold_on_Im_coming.mp3';
const audioFile = './overcooked2-overworld.mp3';
// const audioFile = './A History of Bad Men.mp3';

// import {SonicVisualizer2} from './SonicVisualizer/Visualizer2';
// const app = new SonicVisualizer2();
// import {SonicVisualizer3} from './SonicVisualizer/Visualizer3';
// const app = new SonicVisualizer3(audioFile);
import {BasicPlayer} from './player';

let app = new BasicPlayer();
app.start(audioFile);
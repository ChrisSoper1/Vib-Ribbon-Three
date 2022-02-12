/**
 * This is the entrypoint for the module.  For now lets avoid doing stuff in here directly,
 * and instead reference outside from here.
 */
// import {VibRibbonApplication} from './day2';
// const app = new VibRibbonApplication();

// import {SonicVisualizer2} from './SonicVisualizer/Visualizer2';
// import {SonicVisualizer3} from './SonicVisualizer/Visualizer3';
// import {SonicVisualizer4} from './SonicVisualizer/Visualizer4';
import {SonicVisualizer5} from './SonicVisualizer/Visualizer5';

const audioFile = './Sam_and_Dave-Hold_on_Im_coming.mp3';
// const audioFile = './A History of Bad Men.mp3';

// const app = new SonicVisualizer2();
// const app = new SonicVisualizer3(audioFile);
// const app = new SonicVisualizer4(audioFile);
const app = new SonicVisualizer5();
app.start(audioFile);
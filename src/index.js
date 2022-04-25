/**
 * This is the entrypoint for the module.  For now lets avoid doing stuff in here directly,
 * and instead reference outside from here.
 */
import {LevelTestApp} from "./level_test";

// const audioFile = './Sam_and_Dave-Hold_on_Im_coming.mp3';
// const audioFile = './overcooked2-overworld.mp3';
// const audioFile = './A History of Bad Men.mp3';

const app = new LevelTestApp();
app.start();
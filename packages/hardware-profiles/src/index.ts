import sq5Profile from '../profiles/sq5.json';
import ar2412Profile from '../profiles/ar2412.json';
import stageItemsCatalog from '../profiles/stage-items.json';
import churchDefaultPreset from '../presets/church-default.json';
import scratchDefaultPreset from '../presets/scratch-default.json';

export {
  sq5Profile,
  ar2412Profile,
  stageItemsCatalog,
  churchDefaultPreset,
  scratchDefaultPreset
};

export type StageBoxProfile = typeof ar2412Profile;
export type ConsoleProfile = typeof sq5Profile;
export type StageItemCatalogItem = (typeof stageItemsCatalog)[number];
export type PresetData = typeof churchDefaultPreset;

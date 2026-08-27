export type SceneId =
  | "intro"
  | "status"
  | "energy"
  | "energyGas"
  | "water"
  | "waterStress"
  | "waterBaruth"
  | "bigtech"
  | "bigtechSearch"
  | "protests"
  | "protestsLayer"
  | "outro"
  | "outroFaq"
  | "explore";

export type StorySceneId = Exclude<SceneId, "explore">;

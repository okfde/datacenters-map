export type SceneId =
  | "intro"
  | "status"
  | "energy"
  | "energyGas"
  | "water"
  | "waterBaruth"
  | "bigtech"
  | "bigtechSearch"
  | "protests"
  | "outro"
  | "explore";

export type StorySceneId = Exclude<SceneId, "explore">;

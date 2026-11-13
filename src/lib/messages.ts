import type zh from "../../messages/zh.json";

export type Messages = typeof zh;
export type SkillGroup = Messages["skills"]["groups"][number];
export type ExperienceItem = Messages["experience"]["items"][number];
export type LabDemo = Messages["lab"]["demos"][number];

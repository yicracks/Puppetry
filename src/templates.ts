/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Puppet, PuppetPart, ControlRod } from "./types";

const uuid = () => Math.random().toString(36).substring(2, 9);

export const TEMPLATE_DESCRIPTIONS = {
  hero: {
    name: "武松 (Martial Hero)",
    desc: "身披战袍，手持大刀，关节连贯灵巧。最宜腾挪跌扑，展豪杰侠气。",
  },
  dog: {
    name: "哮天灵犬 (Sacred Hound)",
    desc: "四肢伏地，尾部如火焰跳动，仰天长啸，矫健敏捷。",
  },
  dragon: {
    name: "瑞祥神龙 (Auspicious Dragon)",
    desc: "祥云托底，多节金鳞。首尾合戏，可于幕布上起舞、翻腾、驾雾。",
  },
  tiger: {
    name: "下山猛虎 (Crimson Tiger)",
    desc: "斑斓花纹，额饰王字，张牙舞爪。扑剪冲锋时尽显兽王雄姿。",
  },
};

export function createPuppetFromTemplate(
  type: "hero" | "dog" | "dragon" | "tiger",
  startX: number = 400,
  startY: number = 300
): Puppet {
  const id = uuid();

  switch (type) {
    case "hero": {
      const torsoId = "hero-torso";
      const headId = "hero-head";
      const armUpperId = "hero-arm-u";
      const armLowerId = "hero-arm-l";
      const legUpperId = "hero-leg-u";
      const legLowerId = "hero-leg-l";

      const parts: { [id: string]: PuppetPart } = {
        [torsoId]: {
          id: torsoId,
          name: "身躯",
          parentId: null,
          pivotX: 0,
          pivotY: 0,
          parentAttachX: 0,
          parentAttachY: 0,
          length: 90,
          angle: 0,
          defaultAngle: 0,
          width: 60,
          height: 100,
          svgFill: "rgba(180, 50, 40, 0.75)",
          svgStroke: "rgba(50, 10, 10, 0.9)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -20 -40 L 20 -40 L 15 35 L -15 35 Z",
            "M -8 -25 Q -12 -30 -8 -35 Q -4 -30 -8 -25",
            "M 8 -10 Q 12 -15 8 -20 Q 4 -15 8 -10",
            "M -10 10 Q -6 5 -10 0 Q -14 5 -10 10",
            "M -14 15 L 14 15 L 13 22 L -13 22 Z"
          ],
          decorations: `<rect x="-4" y="14" width="8" height="10" fill="#facc15" stroke="rgba(50, 10, 10, 0.9)" stroke-width="1" rx="1"/>`
        },
        [headId]: {
          id: headId,
          name: "头部",
          parentId: torsoId,
          pivotX: 0,
          pivotY: 35,
          parentAttachX: 0,
          parentAttachY: -40,
          length: 50,
          angle: 0,
          defaultAngle: 0,
          width: 45,
          height: 50,
          svgFill: "rgba(230, 195, 155, 0.8)",
          svgStroke: "rgba(50, 10, 10, 0.9)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -12 -15 C -20 -35 20 -35 12 -15 C 12 -5 20 -2 15 20 C 8 25 -8 25 -15 20 C -20 -2 -12 -5 -12 -15 Z",
            "M -8 -3 Q -12 2 -6 6",
            "M -4 12 L -9 14",
            "M 0 -28 Q 15 -50 8 -60 Q -2 -50 0 -28"
          ],
          decorations: `<path d="M 0 -28 Q 15 -50 8 -60" stroke="#ef4444" stroke-width="2" fill="none" />`
        },
        [armUpperId]: {
          id: armUpperId,
          name: "上臂",
          parentId: torsoId,
          pivotX: 0,
          pivotY: -25,
          parentAttachX: -12,
          parentAttachY: -30,
          length: 45,
          angle: 35,
          defaultAngle: 35,
          width: 20,
          height: 50,
          svgFill: "rgba(180, 50, 40, 0.75)",
          svgStroke: "rgba(50, 10, 10, 0.9)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -8 -25 Q -12 0 0 20 Q 12 0 8 -25 Z"
          ]
        },
        [armLowerId]: {
          id: armLowerId,
          name: "前臂与大刀",
          parentId: armUpperId,
          pivotX: 0,
          pivotY: -15,
          parentAttachX: 0,
          parentAttachY: 20,
          length: 55,
          angle: -50,
          defaultAngle: -50,
          width: 25,
          height: 100,
          svgFill: "rgba(234, 179, 8, 0.8)",
          svgStroke: "rgba(50, 10, 10, 0.9)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -6 -15 L 6 -15 L 4 15 L -4 15 Z",
            "M 0 12 L 3 25 L 1 50 L 12 90 Q 25 100 14 105 L -2 55 L -3 25 Z",
            "M 9 82 L 10 84 L 8 85 Z"
          ]
        },
        [legUpperId]: {
          id: legUpperId,
          name: "腿部大腿",
          parentId: torsoId,
          pivotX: 0,
          pivotY: -20,
          parentAttachX: -4,
          parentAttachY: 30,
          length: 50,
          angle: -25,
          defaultAngle: -25,
          width: 25,
          height: 55,
          svgFill: "rgba(30, 85, 125, 0.75)",
          svgStroke: "rgba(50, 10, 10, 0.9)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -10 -20 C -15 0 -5 25 5 20 C 15 15 15 0 10 -20 Z"
          ]
        },
        [legLowerId]: {
          id: legLowerId,
          name: "小腿与战靴",
          parentId: legUpperId,
          pivotX: 0,
          pivotY: -15,
          parentAttachX: 4,
          parentAttachY: 20,
          length: 45,
          angle: 25,
          defaultAngle: 25,
          width: 20,
          height: 50,
          svgFill: "rgba(24, 24, 27, 0.8)",
          svgStroke: "rgba(50, 10, 10, 0.9)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -6 -15 L 6 -15 L 5 10 L 20 18 L 18 25 L -8 15 Z",
            "M 1 0 Q 5 4 2 8",
            "M 8 12 L 14 14 L 12 17 L 6 14 Z"
          ]
        }
      };

      const rods: ControlRod[] = [
        {
          id: "hero-rod-body",
          name: "主支撑杆",
          partId: torsoId,
          attachX: 0,
          attachY: 0,
          handleX: startX,
          handleY: startY + 150,
          length: 150,
          worldX: startX,
          worldY: startY,
          isPrimary: true
        },
        {
          id: "hero-rod-weapon",
          name: "大刀控制杆",
          partId: armLowerId,
          attachX: 10,
          attachY: 80,
          handleX: startX + 50,
          handleY: startY + 160,
          length: 160,
          worldX: startX + 50,
          worldY: startY + 50,
          isPrimary: false
        },
        {
          id: "hero-rod-leg",
          name: "步伐控制杆",
          partId: legLowerId,
          attachX: 15,
          attachY: 18,
          handleX: startX - 40,
          handleY: startY + 170,
          length: 140,
          worldX: startX - 40,
          worldY: startY + 80,
          isPrimary: false
        }
      ];

      return {
        id,
        name: "武松",
        templateType: "hero",
        x: startX,
        y: startY,
        scale: 1.0,
        depth: 2,
        flipX: false,
        parts,
        rods
      };
    }

    case "dog": {
      const torsoId = "dog-torso";
      const headId = "dog-head";
      const legFId = "dog-leg-front";
      const legBId = "dog-leg-back";
      const tailId = "dog-tail";

      const parts: { [id: string]: PuppetPart } = {
        [torsoId]: {
          id: torsoId,
          name: "身躯",
          parentId: null,
          pivotX: 0,
          pivotY: 0,
          parentAttachX: 0,
          parentAttachY: 0,
          length: 90,
          angle: 0,
          defaultAngle: 0,
          width: 100,
          height: 50,
          svgFill: "rgba(45, 45, 50, 0.8)",
          svgStroke: "rgba(15, 15, 15, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -45 -8 C -45 -30 45 -30 45 -8 C 45 12 -45 20 -45 -8 Z",
            "M -18 -12 Q -8 -20 -4 -12 Q -12 -8 -18 -12",
            "M 12 -12 Q 20 -20 24 -12 Q 16 -8 12 -12"
          ],
          decorations: `<circle cx="0" cy="-4" r="4" fill="#facc15" stroke="none"/>`
        },
        [headId]: {
          id: headId,
          name: "头部",
          parentId: torsoId,
          pivotX: -15,
          pivotY: 25,
          parentAttachX: -40,
          parentAttachY: -10,
          length: 45,
          angle: -10,
          defaultAngle: -10,
          width: 40,
          height: 40,
          svgFill: "rgba(45, 45, 50, 0.8)",
          svgStroke: "rgba(15, 15, 15, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -20 20 C -20 5 -12 -20 4 -20 C 16 -20 28 -8 24 8 L 12 4 L 18 20 L 0 16 Z",
            "M -12 12 L 4 10 L -4 20 Z",
            "M 4 -8 Q 1 -10 6 -12"
          ]
        },
        [legFId]: {
          id: legFId,
          name: "前腿",
          parentId: torsoId,
          pivotX: 0,
          pivotY: -15,
          parentAttachX: -30,
          parentAttachY: 12,
          length: 45,
          angle: 20,
          defaultAngle: 20,
          width: 20,
          height: 50,
          svgFill: "rgba(45, 45, 50, 0.8)",
          svgStroke: "rgba(15, 15, 15, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -8 -15 C -12 8 4 30 10 25 C 12 16 8 -15 -8 -15 Z",
            "M 2 16 L 5 22 M -2 16 L -2 21"
          ]
        },
        [legBId]: {
          id: legBId,
          name: "后腿",
          parentId: torsoId,
          pivotX: 0,
          pivotY: -15,
          parentAttachX: 30,
          parentAttachY: 12,
          length: 45,
          angle: -15,
          defaultAngle: -15,
          width: 25,
          height: 50,
          svgFill: "rgba(45, 45, 50, 0.8)",
          svgStroke: "rgba(15, 15, 15, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -12 -15 C -20 12 0 30 8 25 C 16 16 8 -15 -12 -15 Z",
            "M 1 16 L 4 22 M -2 16 L -3 21"
          ]
        },
        [tailId]: {
          id: tailId,
          name: "尾巴",
          parentId: torsoId,
          pivotX: -15,
          pivotY: 0,
          parentAttachX: 40,
          parentAttachY: -8,
          length: 40,
          angle: 30,
          defaultAngle: 30,
          width: 20,
          height: 50,
          svgFill: "rgba(225, 95, 25, 0.75)",
          svgStroke: "rgba(15, 15, 15, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -8 0 C 0 -20 28 -28 20 8 C 12 16 -4 8 -8 0 Z",
            "M 4 -8 Q 12 -16 8 -4"
          ]
        }
      };

      const rods: ControlRod[] = [
        {
          id: "dog-rod-body",
          name: "主支撑杆",
          partId: torsoId,
          attachX: 0,
          attachY: 0,
          handleX: startX,
          handleY: startY + 140,
          length: 140,
          worldX: startX,
          worldY: startY,
          isPrimary: true
        },
        {
          id: "dog-rod-head",
          name: "狗头操纵杆",
          partId: headId,
          attachX: 8,
          attachY: -8,
          handleX: startX - 50,
          handleY: startY + 120,
          length: 140,
          worldX: startX - 45,
          worldY: startY - 15,
          isPrimary: false
        },
        {
          id: "dog-rod-tail",
          name: "狗尾操纵杆",
          partId: tailId,
          attachX: 12,
          attachY: 12,
          handleX: startX + 50,
          handleY: startY + 130,
          length: 130,
          worldX: startX + 45,
          worldY: startY + 5,
          isPrimary: false
        }
      ];

      return {
        id,
        name: "哮天灵犬",
        templateType: "dog",
        x: startX,
        y: startY,
        scale: 1.0,
        depth: 2,
        flipX: false,
        parts,
        rods
      };
    }

    case "dragon": {
      const headId = "dragon-head";
      const segAId = "dragon-seg-a";
      const segBId = "dragon-seg-b";
      const tailId = "dragon-tail";

      const parts: { [id: string]: PuppetPart } = {
        [headId]: {
          id: headId,
          name: "龙头",
          parentId: null,
          pivotX: 0,
          pivotY: 0,
          parentAttachX: 0,
          parentAttachY: 0,
          length: 70,
          angle: 0,
          defaultAngle: 0,
          width: 70,
          height: 70,
          svgFill: "rgba(35, 135, 80, 0.8)",
          svgStroke: "rgba(10, 40, 20, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -35 15 C -35 -25 15 -35 30 -10 C 35 8 18 35 -8 30 L -12 8 L -25 25 Z",
            "M 8 -25 Q 28 -50 32 -45 Q 20 -25 8 -25",
            "M 20 8 Q 45 35 32 40 Q 24 20 20 8",
            "M 0 -8 A 5 5 0 1 1 10 -8 A 5 5 0 1 1 0 -8"
          ],
          decorations: `<circle cx="5" cy="-8" r="2.5" fill="#ef4444"/><path d="M-20 0 Q-12 8 -20 16" stroke="#f59e0b" fill="none"/>`
        },
        [segAId]: {
          id: segAId,
          name: "前躯节",
          parentId: headId,
          pivotX: -25,
          pivotY: 0,
          parentAttachX: -30,
          parentAttachY: 8,
          length: 55,
          angle: 15,
          defaultAngle: 15,
          width: 60,
          height: 40,
          svgFill: "rgba(35, 135, 80, 0.8)",
          svgStroke: "rgba(10, 40, 20, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -30 -8 C -18 -25 18 -25 30 -8 C 22 12 -22 12 -30 -8 Z",
            "M -12 -8 Q -8 -4 -12 0",
            "M 4 -8 Q 8 -4 4 0",
            "M -4 4 Q 0 8 -4 12"
          ]
        },
        [segBId]: {
          id: segBId,
          name: "后躯节",
          parentId: segAId,
          pivotX: -25,
          pivotY: 0,
          parentAttachX: -25,
          parentAttachY: 0,
          length: 55,
          angle: -20,
          defaultAngle: -20,
          width: 60,
          height: 38,
          svgFill: "rgba(35, 135, 80, 0.75)",
          svgStroke: "rgba(10, 40, 20, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -30 -8 C -18 -25 18 -25 30 -8 C 22 12 -22 12 -30 -8 Z",
            "M -8 -8 Q -4 -4 -8 0",
            "M 8 -8 Q 12 -4 8 0"
          ]
        },
        [tailId]: {
          id: tailId,
          name: "龙尾",
          parentId: segBId,
          pivotX: -25,
          pivotY: 0,
          parentAttachX: -25,
          parentAttachY: 0,
          length: 60,
          angle: 15,
          defaultAngle: 15,
          width: 50,
          height: 50,
          svgFill: "rgba(234, 179, 8, 0.75)",
          svgStroke: "rgba(10, 40, 20, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -20 -4 C -12 -12 4 -30 20 -30 C 8 -8 24 30 12 30 C 0 30 -12 12 -20 -4 Z",
            "M -4 -8 Q 4 -12 8 -4 Q 4 4 -4 -8",
            "M -8 8 Q 0 4 4 12"
          ]
        }
      };

      const rods: ControlRod[] = [
        {
          id: "dragon-rod-head",
          name: "龙头戏杆",
          partId: headId,
          attachX: 8,
          attachY: 8,
          handleX: startX,
          handleY: startY + 150,
          length: 150,
          worldX: startX,
          worldY: startY,
          isPrimary: true
        },
        {
          id: "dragon-rod-body1",
          name: "龙身操纵杆",
          partId: segAId,
          attachX: 0,
          attachY: 8,
          handleX: startX - 60,
          handleY: startY + 160,
          length: 150,
          worldX: startX - 50,
          worldY: startY + 10,
          isPrimary: false
        },
        {
          id: "dragon-rod-tail",
          name: "龙尾操纵杆",
          partId: tailId,
          attachX: 12,
          attachY: 8,
          handleX: startX - 140,
          handleY: startY + 170,
          length: 150,
          worldX: startX - 120,
          worldY: startY + 18,
          isPrimary: false
        }
      ];

      return {
        id,
        name: "祥瑞神龙",
        templateType: "dragon",
        x: startX,
        y: startY,
        scale: 1.1,
        depth: 2,
        flipX: false,
        parts,
        rods
      };
    }

    case "tiger": {
      const torsoId = "tiger-torso";
      const headId = "tiger-head";
      const legFId = "tiger-leg-f";
      const legBId = "tiger-leg-b";
      const tailId = "tiger-tail";

      const parts: { [id: string]: PuppetPart } = {
        [torsoId]: {
          id: torsoId,
          name: "身躯",
          parentId: null,
          pivotX: 0,
          pivotY: 0,
          parentAttachX: 0,
          parentAttachY: 0,
          length: 100,
          angle: 0,
          defaultAngle: 0,
          width: 110,
          height: 60,
          svgFill: "rgba(220, 95, 25, 0.75)",
          svgStroke: "rgba(40, 10, 5, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -55 -12 C -55 -40 50 -40 50 -12 C 50 18 -55 18 -55 -12 Z",
            "M -25 -22 L -20 -12 L -15 -22 Z",
            "M -4 -25 L 0 -12 L 4 -25 Z",
            "M 20 -22 L 25 -12 L 30 -22 Z",
            "M -40 -4 L -30 0 L -40 4 Z"
          ]
        },
        [headId]: {
          id: headId,
          name: "头部",
          parentId: torsoId,
          pivotX: -12,
          pivotY: 20,
          parentAttachX: -50,
          parentAttachY: -12,
          length: 50,
          angle: -5,
          defaultAngle: -5,
          width: 50,
          height: 50,
          svgFill: "rgba(220, 95, 25, 0.75)",
          svgStroke: "rgba(40, 10, 5, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -20 18 C -20 -8 -12 -25 12 -25 C 30 -25 30 5 22 22 C 8 25 -8 25 -20 18 Z",
            "M 12 8 L 22 12 L 15 18 Z",
            "M -3 -18 L 3 -18 M -3 -14 L 3 -14 M 0 -20 L 0 -10 M -4 -10 L 4 -10"
          ],
          decorations: `<circle cx="4" cy="-4" r="3.5" fill="#facc15" stroke="rgba(40,10,5,0.95)" stroke-width="1"/>`
        },
        [legFId]: {
          id: legFId,
          name: "前爪",
          parentId: torsoId,
          pivotX: 0,
          pivotY: -15,
          parentAttachX: -35,
          parentAttachY: 18,
          length: 45,
          angle: 15,
          defaultAngle: 15,
          width: 25,
          height: 50,
          svgFill: "rgba(220, 95, 25, 0.75)",
          svgStroke: "rgba(40, 10, 5, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -10 -18 C -12 8 4 30 12 25 C 16 16 10 -18 -10 -18 Z",
            "M -4 -2 L 4 0",
            "M -2 6 L 6 8"
          ]
        },
        [legBId]: {
          id: legBId,
          name: "后爪",
          parentId: torsoId,
          pivotX: 0,
          pivotY: -15,
          parentAttachX: 35,
          parentAttachY: 18,
          length: 45,
          angle: -15,
          defaultAngle: -15,
          width: 28,
          height: 50,
          svgFill: "rgba(220, 95, 25, 0.75)",
          svgStroke: "rgba(40, 10, 5, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -12 -18 C -18 8 2 30 10 25 C 18 16 12 -18 -12 -18 Z",
            "M -6 -2 L 3 -1",
            "M -4 8 L 5 6"
          ]
        },
        [tailId]: {
          id: tailId,
          name: "虎尾",
          parentId: torsoId,
          pivotX: -25,
          pivotY: 0,
          parentAttachX: 50,
          parentAttachY: -8,
          length: 55,
          angle: 40,
          defaultAngle: 40,
          width: 18,
          height: 60,
          svgFill: "rgba(220, 95, 25, 0.75)",
          svgStroke: "rgba(40, 10, 5, 0.95)",
          svgStrokeWidth: 1.5,
          svgPaths: [
            "M -8 0 C -4 -20 20 -35 12 20 C 6 25 -4 12 -8 0 Z",
            "M -2 -12 L 3 -10",
            "M 1 -4 L 6 -2"
          ]
        }
      };

      const rods: ControlRod[] = [
        {
          id: "tiger-rod-body",
          name: "主支撑杆",
          partId: torsoId,
          attachX: 0,
          attachY: 0,
          handleX: startX,
          handleY: startY + 150,
          length: 150,
          worldX: startX,
          worldY: startY,
          isPrimary: true
        },
        {
          id: "tiger-rod-head",
          name: "虎头操纵杆",
          partId: headId,
          attachX: 8,
          attachY: -8,
          handleX: startX - 50,
          handleY: startY + 140,
          length: 150,
          worldX: startX - 45,
          worldY: startY - 15,
          isPrimary: false
        },
        {
          id: "tiger-rod-tail",
          name: "虎尾操纵杆",
          partId: tailId,
          attachX: 8,
          attachY: 15,
          handleX: startX + 60,
          handleY: startY + 150,
          length: 140,
          worldX: startX + 55,
          worldY: startY + 10,
          isPrimary: false
        }
      ];

      return {
        id,
        name: "下山猛虎",
        templateType: "tiger",
        x: startX,
        y: startY,
        scale: 1.0,
        depth: 2,
        flipX: false,
        parts,
        rods
      };
    }
  }
}

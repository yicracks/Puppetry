/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface PuppetPart {
  id: string;
  name: string;
  parentId: string | null;
  
  // Connection point relative to this part's own origin
  pivotX: number;
  pivotY: number;
  
  // Connection point on parent part (if parent exists) where this pivot attaches
  parentAttachX: number;
  parentAttachY: number;

  // Length of this segment (used for IK or rendering reference)
  length: number;

  // Relative rotation angle (degrees)
  angle: number;
  defaultAngle: number;

  // Visual outline (gorgeous traditional Chinese carved leather SVG details)
  svgPaths: string[];
  svgFill: string;
  svgStroke: string;
  svgStrokeWidth?: number;
  
  // Custom design specs
  width: number;
  height: number;
  
  // Custom decorative details in SVG
  decorations?: string; 
}

export interface ControlRod {
  id: string;
  name: string;
  partId: string;       // Attached to this part
  attachX: number;     // Attachment offset on the part
  attachY: number;     // Attachment offset on the part
  
  // Control handle position (absolute coordinates on the stage canvas)
  handleX: number;
  handleY: number;
  
  // Height/length of the control rod
  length: number;
  
  // Current position of the attachment node in world coordinates
  worldX: number;
  worldY: number;

  isPrimary: boolean;  // If true, dragging this translates the entire puppet
}

export interface Puppet {
  id: string;
  name: string;
  templateType: "hero" | "dog" | "dragon" | "tiger";
  
  // World position on stage
  x: number;
  y: number;
  scale: number;
  depth: number; // 0 (flat against screen) to 10 (far from screen, near light)
  flipX: boolean;

  parts: { [id: string]: PuppetPart };
  rods: ControlRod[];
}

export interface RecordedFrame {
  timestamp: number;
  puppetX: number;
  puppetY: number;
  puppetDepth: number;
  puppetScale: number;
  puppetFlipX: boolean;
  partAngles: { [partId: string]: number };
  rodHandles: { [rodId: string]: Vec2 };
}

export interface Recording {
  name: string;
  puppetTemplateType: string;
  frames: RecordedFrame[];
  duration: number; // in ms
}

export interface PlayScript {
  title: string;
  backgroundDescription: string;
  characters: string[];
  scenes: {
    sceneTitle: string;
    narration: string;
    dialogs: {
      character: string;
      lines: string;
    }[];
  }[];
}

export interface BackdropPreset {
  id: string;
  name: string;
  bgGradient: string;
  silhouetteSvg?: string; // traditional foreground papercut layers
  ambientColor: string;
  candleFlickerSpeed: number;
}

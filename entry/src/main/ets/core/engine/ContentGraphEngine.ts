/**
 * Content Graph Engine
 * Implements automatic type conversion between workflow actions
 */
import { DataType, TypeConversion, DataTypeUtils } from '../models/DataType';

interface TypeNode {
  type: DataType;
  edges: TypeEdge[];
}

interface TypeEdge {
  to: DataType;
  conversion: TypeConversion;
}

export interface ConversionPath {
  from: DataType;
  to: DataType;
  steps: TypeConversion[];
  totalCost: number;
  possible: boolean;
}

/**
 * Content Graph Engine singleton
 */
export class ContentGraphEngine {
  private static instance: ContentGraphEngine;
  private typeGraph: Map<DataType, TypeNode> = new Map();
  private conversions: Map<string, TypeConversion[]> = new Map();

  private constructor() {
    this.initializeTypeGraph();
    this.registerBuiltInConversions();
  }

  static getInstance(): ContentGraphEngine {
    if (!ContentGraphEngine.instance) {
      ContentGraphEngine.instance = new ContentGraphEngine();
    }
    return ContentGraphEngine.instance;
  }

  private initializeTypeGraph(): void {
    const types = Object.values(DataType);
    types.forEach(type => {
      this.typeGraph.set(type, { type, edges: [] });
    });
  }

  private registerBuiltInConversions(): void {
    // Number to Text
    this.registerConversion({
      from: DataType.NUMBER,
      to: DataType.TEXT,
      converter: (value) => String(value),
      cost: 1,
      description: 'Convert number to text'
    });

    // Boolean to Text
    this.registerConversion({
      from: DataType.BOOLEAN,
      to: DataType.TEXT,
      converter: (value) => value ? 'Yes' : 'No',
      cost: 1,
      description: 'Convert boolean to text'
    });

    // Text to Number
    this.registerConversion({
      from: DataType.TEXT,
      to: DataType.NUMBER,
      converter: (value) => {
        const num = Number(value);
        return isNaN(num) ? null : num;
      },
      cost: 2,
      description: 'Parse text as number'
    });

    // Calendar Event to Location
    this.registerConversion({
      from: DataType.CALENDAR_EVENT,
      to: DataType.LOCATION,
      converter: (value) => value?.location || null,
      cost: 1,
      description: 'Extract location from calendar event'
    });

    // Video to Image (thumbnail)
    this.registerConversion({
      from: DataType.VIDEO,
      to: DataType.IMAGE,
      converter: (value) => value?.thumbnail || null,
      cost: 2,
      description: 'Extract thumbnail from video'
    });

    // Music to Image (album art)
    this.registerConversion({
      from: DataType.MUSIC,
      to: DataType.IMAGE,
      converter: (value) => value?.albumArt || null,
      cost: 2,
      description: 'Extract album art from music'
    });

    // Array to Any (first element)
    this.registerConversion({
      from: DataType.ARRAY,
      to: DataType.ANY,
      converter: (value) => Array.isArray(value) && value.length > 0 ? value[0] : null,
      cost: 1,
      description: 'Extract first item from array'
    });

    // Object to Text (JSON)
    this.registerConversion({
      from: DataType.OBJECT,
      to: DataType.TEXT,
      converter: (value) => JSON.stringify(value),
      cost: 1,
      description: 'Serialize object to text'
    });

    // Text to Object (JSON parse)
    this.registerConversion({
      from: DataType.TEXT,
      to: DataType.OBJECT,
      converter: (value) => {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      },
      cost: 2,
      description: 'Parse text as JSON object'
    });

    // Location to Map Route
    this.registerConversion({
      from: DataType.LOCATION,
      to: DataType.MAP_ROUTE,
      converter: (value) => ({ destination: value }),
      cost: 1,
      description: 'Create route to location'
    });
  }

  registerConversion(conversion: TypeConversion): void {
    const key = `${conversion.from}-${conversion.to}`;
    
    if (!this.conversions.has(key)) {
      this.conversions.set(key, []);
    }
    this.conversions.get(key)!.push(conversion);

    const fromNode = this.typeGraph.get(conversion.from);
    if (fromNode) {
      fromNode.edges.push({ to: conversion.to, conversion });
    }
  }

  findConversionPath(source: DataType, target: DataType): ConversionPath {
    if (source === target || target === DataType.ANY || DataTypeUtils.isCompatible(source, target)) {
      return { from: source, to: target, steps: [], totalCost: 0, possible: true };
    }

    const distances: Map<DataType, number> = new Map();
    const previous: Map<DataType, TypeConversion | null> = new Map();
    const unvisited: Set<DataType> = new Set();

    Object.values(DataType).forEach(type => {
      distances.set(type, Infinity);
      previous.set(type, null);
      unvisited.add(type);
    });
    distances.set(source, 0);

    while (unvisited.size > 0) {
      let current: DataType | undefined;
      let minDistance = Infinity;
      unvisited.forEach(type => {
        const dist = distances.get(type) || Infinity;
        if (dist < minDistance) {
          minDistance = dist;
          current = type;
        }
      });

      if (!current || minDistance === Infinity) break;
      if (current === target) break;

      unvisited.delete(current);

      const node = this.typeGraph.get(current);
      if (node) {
        node.edges.forEach(edge => {
          if (unvisited.has(edge.to)) {
            const altDistance = (distances.get(current) || Infinity) + edge.conversion.cost;
            if (altDistance < (distances.get(edge.to) || Infinity)) {
              distances.set(edge.to, altDistance);
              previous.set(edge.to, edge.conversion);
            }
          }
        });
      }
    }

    if ((distances.get(target) || Infinity) === Infinity) {
      return { from: source, to: target, steps: [], totalCost: 0, possible: false };
    }

    const steps: TypeConversion[] = [];
    let current: DataType | null = target;
    while (current !== source) {
      const conv = previous.get(current!);
      if (!conv) break;
      steps.unshift(conv);
      current = conv.from;
    }

    return { from: source, to: target, steps, totalCost: distances.get(target) || 0, possible: true };
  }

  convert(value: any, sourceType: DataType, targetType: DataType): { success: boolean; value: any; error?: string } {
    if (sourceType === targetType || targetType === DataType.ANY) {
      return { success: true, value };
    }

    const path = this.findConversionPath(sourceType, targetType);
    
    if (!path.possible) {
      return { success: false, value: null, error: `Cannot convert from ${sourceType} to ${targetType}` };
    }

    let currentValue = value;
    for (const conversion of path.steps) {
      try {
        const converted = conversion.converter(currentValue);
        if (converted === null && path.steps.length > 0) {
          return { success: false, value: null, error: `Conversion failed: ${conversion.description}` };
        }
        currentValue = converted;
      } catch (error) {
        return { success: false, value: null, error: `Conversion error: ${error instanceof Error ? error.message : String(error)}` };
      }
    }

    return { success: true, value: currentValue };
  }

  canConvert(sourceType: DataType, targetType: DataType): boolean {
    const path = this.findConversionPath(sourceType, targetType);
    return path.possible;
  }

  getPossibleConversions(sourceType: DataType): Array<{ to: DataType; description: string; cost: number }> {
    const results: Array<{ to: DataType; description: string; cost: number }> = [];
    
    Object.values(DataType).forEach(targetType => {
      if (sourceType !== targetType) {
        const path = this.findConversionPath(sourceType, targetType);
        if (path.possible) {
          const lastStep = path.steps[path.steps.length - 1];
          results.push({
            to: targetType,
            description: lastStep ? lastStep.description : 'Direct conversion',
            cost: path.totalCost
          });
        }
      }
    });

    return results.sort((a, b) => a.cost - b.cost);
  }

  clear(): void {
    this.conversions.clear();
    this.typeGraph.forEach(node => { node.edges = []; });
    this.registerBuiltInConversions();
  }
}

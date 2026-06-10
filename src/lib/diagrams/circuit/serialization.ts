import { ICircuit, ICircuitElement } from './types';
import {
  ResistorElement,
  CapacitorElement,
  InductorElement,
  VoltageSourceElement,
  WireElement,
  GroundElement,
  SwitchElement,
} from './elements';

export interface SerializedElement {
  id: string;
  type: string;
  x: number;
  y: number;
  x2: number;
  y2: number;
  resistance?: number;
  capacitance?: number;
  inductance?: number;
  maxVoltage?: number;
  closed?: boolean;
  waveform?: 'DC' | 'AC' | 'SQUARE' | 'TRIANGLE' | 'PULSE' | 'PWL';
  frequency?: number;
  dutyCycle?: number;
  bias?: number;
  pwlPoints?: { t: number; v: number }[];
  esr?: number;
  seriesResistance?: number;
}

export interface SerializedCircuit {
  elements: SerializedElement[];
}

export function serializeCircuit(circuit: ICircuit): string {
  const elementsData: SerializedElement[] = circuit.elements.map((elm) => {
    const base: SerializedElement = {
      id: elm.id,
      type: elm.type,
      x: elm.x,
      y: elm.y,
      x2: elm.x2,
      y2: elm.y2,
    };
    if (elm instanceof ResistorElement) {
      base.resistance = elm.resistance;
    } else if (elm instanceof CapacitorElement) {
      base.capacitance = elm.capacitance;
      base.esr = elm.esr;
    } else if (elm instanceof InductorElement) {
      base.inductance = elm.inductance;
      base.seriesResistance = elm.seriesResistance;
    } else if (elm instanceof VoltageSourceElement) {
      base.maxVoltage = elm.maxVoltage;
      base.waveform = elm.waveform;
      base.frequency = elm.frequency;
      base.dutyCycle = elm.dutyCycle;
      base.bias = elm.bias;
      base.pwlPoints = elm.pwlPoints;
    } else if (elm instanceof SwitchElement) {
      base.closed = elm.closed;
    }
    return base;
  });

  return JSON.stringify({ elements: elementsData });
}

function isFiniteNumber(val: any): val is number {
  return typeof val === 'number' && Number.isFinite(val);
}

export function deserializeCircuit(circuit: ICircuit, jsonStr: string): void {
  let data: any;
  try {
    data = JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse circuit JSON:', e);
    return;
  }

  if (!data || typeof data !== 'object' || !Array.isArray(data.elements)) {
    console.error('Invalid circuit state data structure');
    return;
  }

  circuit.clearElements();

  for (const elm of data.elements) {
    if (!elm || typeof elm !== 'object') continue;

    // Validate standard fields
    if (typeof elm.id !== 'string' || typeof elm.type !== 'string') continue;
    if (!isFiniteNumber(elm.x) || !isFiniteNumber(elm.y) || !isFiniteNumber(elm.x2) || !isFiniteNumber(elm.y2)) continue;

    // Clean standard properties to avoid prototype pollution
    const id = elm.id;
    const type = elm.type;
    const x = elm.x;
    const y = elm.y;
    const x2 = elm.x2;
    const y2 = elm.y2;

    let newElm: ICircuitElement | undefined;

    switch (type) {
      case 'resistor': {
        let resistance = 1000;
        if (isFiniteNumber(elm.resistance) && elm.resistance > 0) {
          resistance = elm.resistance;
        }
        newElm = new ResistorElement(x, y, x2, y2, resistance);
        break;
      }
      case 'capacitor': {
        let capacitance = 1e-3;
        if (isFiniteNumber(elm.capacitance) && elm.capacitance > 0) {
          capacitance = elm.capacitance;
        }
        const cap = new CapacitorElement(x, y, x2, y2, capacitance);
        if (isFiniteNumber(elm.esr) && elm.esr >= 0) {
          cap.esr = elm.esr;
        }
        newElm = cap;
        break;
      }
      case 'inductor': {
        let inductance = 1.0;
        if (isFiniteNumber(elm.inductance) && elm.inductance > 0) {
          inductance = elm.inductance;
        }
        const ind = new InductorElement(x, y, x2, y2, inductance);
        if (isFiniteNumber(elm.seriesResistance) && elm.seriesResistance >= 0) {
          ind.seriesResistance = elm.seriesResistance;
        }
        newElm = ind;
        break;
      }
      case 'voltage': {
        let voltage = 5.0;
        if (isFiniteNumber(elm.maxVoltage)) {
          voltage = elm.maxVoltage;
        }
        const vsrc = new VoltageSourceElement(x, y, x2, y2, voltage);
        if (typeof elm.waveform === 'string' && ['DC', 'AC', 'SQUARE', 'TRIANGLE', 'PULSE', 'PWL'].includes(elm.waveform)) {
          vsrc.waveform = elm.waveform as any;
        }
        if (isFiniteNumber(elm.frequency) && elm.frequency > 0) {
          vsrc.frequency = elm.frequency;
        }
        if (isFiniteNumber(elm.dutyCycle) && elm.dutyCycle >= 0 && elm.dutyCycle <= 1) {
          vsrc.dutyCycle = elm.dutyCycle;
        }
        if (isFiniteNumber(elm.bias)) {
          vsrc.bias = elm.bias;
        }
        if (Array.isArray(elm.pwlPoints)) {
          const validatedPoints: { t: number; v: number }[] = [];
          for (const pt of elm.pwlPoints) {
            if (pt && typeof pt === 'object' && isFiniteNumber(pt.t) && isFiniteNumber(pt.v)) {
              validatedPoints.push({ t: pt.t, v: pt.v });
            }
          }
          vsrc.pwlPoints = validatedPoints;
        }
        newElm = vsrc;
        break;
      }
      case 'switch': {
        const sw = new SwitchElement(x, y, x2, y2);
        sw.closed = !!elm.closed;
        newElm = sw;
        break;
      }
      case 'wire': {
        newElm = new WireElement(x, y, x2, y2);
        break;
      }
      case 'ground': {
        newElm = new GroundElement(x, y);
        break;
      }
      default:
        // Skip unknown/unsupported components
        break;
    }

    if (newElm) {
      newElm.id = id;
      circuit.addElement(newElm);
    }
  }
}

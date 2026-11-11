import { describe, it, expect } from 'vitest';
import {
  clampZoom,
  calcZoomStep,
  calcWheelZoom,
  calculatePanLimits,
  clampPan,
  calcTouchDistance,
  calcPinchScale,
  MIN_ZOOM,
  MAX_ZOOM,
} from './mockupZoom';

describe('mockupZoom utilities', () => {
  describe('clampZoom', () => {
    it('should maintain values within limits', () => {
      expect(clampZoom(2.5)).toBe(2.5);
    });

    it('should clamp values lower than MIN_ZOOM', () => {
      expect(clampZoom(0.5)).toBe(MIN_ZOOM);
    });

    it('should clamp values higher than MAX_ZOOM', () => {
      expect(clampZoom(5.0)).toBe(MAX_ZOOM);
    });
  });

  describe('calcZoomStep', () => {
    it('should increment scale when direction is in', () => {
      expect(calcZoomStep(1.0, 'in', 0.5)).toBe(1.5);
    });

    it('should decrement scale when direction is out', () => {
      expect(calcZoomStep(2.0, 'out', 0.5)).toBe(1.5);
    });

    it('should not exceed boundaries on step', () => {
      expect(calcZoomStep(4.0, 'in', 0.5)).toBe(4.0);
      expect(calcZoomStep(1.0, 'out', 0.5)).toBe(1.0);
    });
  });

  describe('calcWheelZoom', () => {
    it('should zoom in when wheel deltaY is negative', () => {
      expect(calcWheelZoom(1.0, -100)).toBe(1.25);
    });

    it('should zoom out when wheel deltaY is positive', () => {
      expect(calcWheelZoom(2.0, 100)).toBe(1.75);
    });
  });

  describe('calculatePanLimits and clampPan', () => {
    it('should return zero limits when scale is 1.0', () => {
      const limits = calculatePanLimits(1.0, 800, 600);
      expect(limits).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
    });

    it('should calculate overflow limits when scale is 2.0', () => {
      const limits = calculatePanLimits(2.0, 800, 600);
      expect(limits).toEqual({ minX: -400, maxX: 400, minY: -300, maxY: 300 });
    });

    it('should clamp coordinates within calculated limits', () => {
      const limits = { minX: -100, maxX: 100, minY: -50, maxY: 50 };
      expect(clampPan(200, -80, limits)).toEqual({ x: 100, y: -50 });
      expect(clampPan(-150, 60, limits)).toEqual({ x: -100, y: 50 });
      expect(clampPan(20, -10, limits)).toEqual({ x: 20, y: -10 });
    });
  });

  describe('touch gestures', () => {
    it('should calculate Euclidean distance between two touch points', () => {
      const p1 = { clientX: 0, clientY: 0 };
      const p2 = { clientX: 30, clientY: 40 };
      expect(calcTouchDistance(p1, p2)).toBe(50);
    });

    it('should calculate pinch scale proportionally', () => {
      const initialDist = 100;
      const currentDist = 150;
      expect(calcPinchScale(1.0, initialDist, currentDist)).toBe(1.5);
    });

    it('should clamp pinch scale to bounds', () => {
      expect(calcPinchScale(1.0, 100, 500)).toBe(MAX_ZOOM);
      expect(calcPinchScale(1.5, 100, 10)).toBe(MIN_ZOOM);
    });
  });
});


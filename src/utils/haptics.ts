import { Haptics, ImpactStyle } from '@capacitor/haptics';

export class HapticsService {
  /**
   * Light impact on standard button tap
   */
  static async light(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Graceful fallback for standard browser or unsupported hardware
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  }

  /**
   * Medium impact on navigation D-Pad or OK action
   */
  static async medium(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
    }
  }

  /**
   * Heavy impact for critical actions like Power toggle
   */
  static async heavy(): Promise<void> {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }
    }
  }
}

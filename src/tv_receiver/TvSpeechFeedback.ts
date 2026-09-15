/**
 * TV Speech Feedback Engine
 * Leverages the browser SpeechSynthesis API to provide auditory 10-foot television announcements
 * for critical events such as 'TV Powering On' and 'Connected to Mobile'.
 */

export class TvSpeechFeedback {
  private static enabled: boolean = true;
  private static lastAnnouncement: string = "";
  private static lastAnnouncementTime: number = 0;
  private static activeUtterance: SpeechSynthesisUtterance | null = null;

  /**
   * Checks if browser supports SpeechSynthesis API
   */
  static isSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  /**
   * Set voice announcement toggle state
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("tv_speech_feedback_enabled", enabled ? "true" : "false");
      } catch {}
    }
  }

  /**
   * Get current voice announcement toggle state
   */
  static isEnabled(): boolean {
    if (typeof localStorage !== "undefined") {
      try {
        const val = localStorage.getItem("tv_speech_feedback_enabled");
        if (val !== null) return val === "true";
      } catch {}
    }
    return this.enabled;
  }

  /**
   * Synthesizes and speaks text using browser SpeechSynthesis API
   */
  static speak(text: string, force: boolean = false): boolean {
    if (!this.isSupported()) {
      console.warn("[TvSpeechFeedback] SpeechSynthesis not supported in this environment.");
      return false;
    }

    if (!this.isEnabled() && !force) {
      return false;
    }

    const now = Date.now();
    // Guard against rapid duplicate speech within 2.5s unless forced
    if (!force && this.lastAnnouncement === text && now - this.lastAnnouncementTime < 2500) {
      return false;
    }

    try {
      // Cancel previous utterance to prevent stutter/stacking
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly measured for 10-foot living room acoustics
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select high quality English voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferredVoice =
          voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Premium"))) ||
          voices.find(v => v.lang.startsWith("en")) ||
          voices[0];
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onend = () => {
        this.activeUtterance = null;
      };

      utterance.onerror = (err) => {
        console.warn("[TvSpeechFeedback] Speech synthesis playback warning:", err);
        this.activeUtterance = null;
      };

      this.activeUtterance = utterance;
      this.lastAnnouncement = text;
      this.lastAnnouncementTime = now;

      window.speechSynthesis.speak(utterance);

      // Workaround for Chrome/WebKit bug where long utterances get paused indefinitely
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      return true;
    } catch (err) {
      console.warn("[TvSpeechFeedback] Failed to synthesize speech:", err);
      return false;
    }
  }

  /**
   * Announce TV Display Powered On
   */
  static announceTvPowerOn(force: boolean = false): boolean {
    return this.speak("TV Powering On", force);
  }

  /**
   * Announce Mobile Phone Controller Connected
   */
  static announceConnectedToMobile(force: boolean = false): boolean {
    return this.speak("Connected to Mobile", force);
  }
}

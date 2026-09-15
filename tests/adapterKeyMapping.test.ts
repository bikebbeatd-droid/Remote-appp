import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Adapter Key Mapping Tests", () => {
  // Roku ECP Key Map
  const rokuKeyMap: Record<string, string> = {
    POWER: "Power",
    HOME: "Home",
    BACK: "Back",
    UP: "Up",
    DOWN: "Down",
    LEFT: "Left",
    RIGHT: "Right",
    OK: "Select",
    SELECT: "Select",
    VOLUME_UP: "VolumeUp",
    VOLUME_DOWN: "VolumeDown",
    MUTE: "VolumeMute",
    PLAY: "Play",
    PAUSE: "Play",
    PLAY_PAUSE: "Play",
    REWIND: "Rev",
    FAST_FORWARD: "Fwd",
    CHANNEL_UP: "ChannelUp",
    CHANNEL_DOWN: "ChannelDown",
    INPUT: "InputTuner"
  };

  // Android TV Keycode Map
  const atvKeycodeMap: Record<string, number> = {
    POWER: 26,
    HOME: 3,
    BACK: 4,
    UP: 19,
    DOWN: 20,
    LEFT: 21,
    RIGHT: 22,
    OK: 23,
    SELECT: 23,
    ENTER: 66,
    VOLUME_UP: 24,
    VOLUME_DOWN: 25,
    MUTE: 164,
    PLAY: 126,
    PAUSE: 127,
    PLAY_PAUSE: 85,
    STOP: 86,
    NEXT: 87,
    PREV: 88,
    REWIND: 89,
    FAST_FORWARD: 90,
    CHANNEL_UP: 166,
    CHANNEL_DOWN: 167,
    MENU: 82,
    SETTINGS: 176,
    INPUT: 178,
    INFO: 165,
    GUIDE: 172,
    VOICE: 219
  };

  // Sony IRCC Code Map
  const sonyIrccMap: Record<string, string> = {
    POWER: "AAAAAQAAAAEAAAAVAw==",
    HOME: "AAAAAQAAAAEAAABgAw==",
    BACK: "AAAAAQAAAAEAAABjAw==",
    UP: "AAAAAQAAAAEAAAB0Aw==",
    DOWN: "AAAAAQAAAAEAAAB1Aw==",
    LEFT: "AAAAAQAAAAEAAAA0Aw==",
    RIGHT: "AAAAAQAAAAEAAAAzAw==",
    OK: "AAAAAQAAAAEAAABlAw==",
    VOLUME_UP: "AAAAAQAAAAEAAAASAw==",
    VOLUME_DOWN: "AAAAAQAAAAEAAAATAw==",
    MUTE: "AAAAAQAAAAEAAAAUAw=="
  };

  it("correctly maps standard commands to Roku ECP keys", () => {
    assert.equal(rokuKeyMap["HOME"], "Home");
    assert.equal(rokuKeyMap["BACK"], "Back");
    assert.equal(rokuKeyMap["VOLUME_UP"], "VolumeUp");
    assert.equal(rokuKeyMap["OK"], "Select");
    assert.equal(rokuKeyMap["POWER"], "Power");
  });

  it("correctly maps standard commands to Android TV keycodes", () => {
    assert.equal(atvKeycodeMap["HOME"], 3);
    assert.equal(atvKeycodeMap["BACK"], 4);
    assert.equal(atvKeycodeMap["UP"], 19);
    assert.equal(atvKeycodeMap["DOWN"], 20);
    assert.equal(atvKeycodeMap["LEFT"], 21);
    assert.equal(atvKeycodeMap["RIGHT"], 22);
    assert.equal(atvKeycodeMap["OK"], 23);
    assert.equal(atvKeycodeMap["VOLUME_UP"], 24);
    assert.equal(atvKeycodeMap["VOLUME_DOWN"], 25);
    assert.equal(atvKeycodeMap["POWER"], 26);
  });

  it("correctly maps Sony BRAVIA IRCC Base64 codes", () => {
    assert.equal(sonyIrccMap["POWER"], "AAAAAQAAAAEAAAAVAw==");
    assert.equal(sonyIrccMap["HOME"], "AAAAAQAAAAEAAABgAw==");
    assert.equal(sonyIrccMap["VOLUME_UP"], "AAAAAQAAAAEAAAASAw==");
  });
});

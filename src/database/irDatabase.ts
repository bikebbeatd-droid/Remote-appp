import { IRCodeSet } from "./types";

export const GLOBAL_IR_DATABASE: IRCodeSet[] = [
  {
    id: "ir_samsung_tv_nec",
    brand: "Samsung",
    deviceType: "tv",
    name: "Samsung Smart TV (NEC Protocol 38kHz)",
    codes: {
      POWER: { command: "POWER", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E040BF" },
      VOLUME_UP: { command: "VOLUME_UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E0E01F" },
      VOLUME_DOWN: { command: "VOLUME_DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E0D02F" },
      MUTE: { command: "MUTE", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E0F00F" },
      UP: { command: "UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E006F9" },
      DOWN: { command: "DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E08679" },
      LEFT: { command: "LEFT", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E0A659" },
      RIGHT: { command: "RIGHT", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E046B9" },
      OK: { command: "OK", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E016E9" },
      HOME: { command: "HOME", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E058A7" },
      BACK: { command: "BACK", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E01AE5" },
      MENU: { command: "MENU", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E058A7" },
      INPUT: { command: "INPUT", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E0807F" },
      CHANNEL_UP: { command: "CHANNEL_UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E048B7" },
      CHANNEL_DOWN: { command: "CHANNEL_DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E008F7" },
      NUMBER_0: { command: "NUMBER_0", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E08877" },
      NUMBER_1: { command: "NUMBER_1", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E020DF" },
      NUMBER_2: { command: "NUMBER_2", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E0A05F" },
      NUMBER_3: { command: "NUMBER_3", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E0609F" },
      NUMBER_4: { command: "NUMBER_4", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E010EF" },
      NUMBER_5: { command: "NUMBER_5", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E0906F" },
      NUMBER_6: { command: "NUMBER_6", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E050AF" },
      NUMBER_7: { command: "NUMBER_7", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E030CF" },
      NUMBER_8: { command: "NUMBER_8", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E0B04F" },
      NUMBER_9: { command: "NUMBER_9", frequencyKhz: 38, protocolType: "NEC", codeHex: "E0E0708F" }
    }
  },
  {
    id: "ir_lg_tv_nec",
    brand: "LG",
    deviceType: "tv",
    name: "LG webOS / Cinema 3D TV (NEC Protocol 38kHz)",
    codes: {
      POWER: { command: "POWER", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF10EF" },
      VOLUME_UP: { command: "VOLUME_UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF40BF" },
      VOLUME_DOWN: { command: "VOLUME_DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DFC03F" },
      MUTE: { command: "MUTE", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF906F" },
      UP: { command: "UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF02FD" },
      DOWN: { command: "DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF827D" },
      LEFT: { command: "LEFT", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DFE01F" },
      RIGHT: { command: "RIGHT", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF609F" },
      OK: { command: "OK", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF22DD" },
      HOME: { command: "HOME", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF3EC1" },
      BACK: { command: "BACK", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF14EB" },
      INPUT: { command: "INPUT", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DFD02F" },
      CHANNEL_UP: { command: "CHANNEL_UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF00FF" },
      CHANNEL_DOWN: { command: "CHANNEL_DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF807F" }
    }
  },
  {
    id: "ir_sony_tv_sirc",
    brand: "Sony",
    deviceType: "tv",
    name: "Sony Bravia (SIRC 12/15-bit 40kHz)",
    codes: {
      POWER: { command: "POWER", frequencyKhz: 40, protocolType: "SONY", codeHex: "0A90" },
      VOLUME_UP: { command: "VOLUME_UP", frequencyKhz: 40, protocolType: "SONY", codeHex: "0490" },
      VOLUME_DOWN: { command: "VOLUME_DOWN", frequencyKhz: 40, protocolType: "SONY", codeHex: "0C90" },
      MUTE: { command: "MUTE", frequencyKhz: 40, protocolType: "SONY", codeHex: "0290" },
      UP: { command: "UP", frequencyKhz: 40, protocolType: "SONY", codeHex: "02F0" },
      DOWN: { command: "DOWN", frequencyKhz: 40, protocolType: "SONY", codeHex: "0CF0" },
      LEFT: { command: "LEFT", frequencyKhz: 40, protocolType: "SONY", codeHex: "02D0" },
      RIGHT: { command: "RIGHT", frequencyKhz: 40, protocolType: "SONY", codeHex: "0CD0" },
      OK: { command: "OK", frequencyKhz: 40, protocolType: "SONY", codeHex: "0A70" },
      HOME: { command: "HOME", frequencyKhz: 40, protocolType: "SONY", codeHex: "0070" },
      INPUT: { command: "INPUT", frequencyKhz: 40, protocolType: "SONY", codeHex: "0A50" }
    }
  },
  {
    id: "ir_tcl_tv_nec",
    brand: "TCL",
    deviceType: "tv",
    name: "TCL Roku / Android TV (NEC 38kHz)",
    codes: {
      POWER: { command: "POWER", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A28D72" },
      VOLUME_UP: { command: "VOLUME_UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A248B7" },
      VOLUME_DOWN: { command: "VOLUME_DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A2C837" },
      MUTE: { command: "MUTE", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A208F7" },
      UP: { command: "UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A228D7" },
      DOWN: { command: "DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A2A857" },
      LEFT: { command: "LEFT", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A26897" },
      RIGHT: { command: "RIGHT", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A2E817" },
      OK: { command: "OK", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A218E7" },
      HOME: { command: "HOME", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A29867" },
      BACK: { command: "BACK", frequencyKhz: 38, protocolType: "NEC", codeHex: "F1A258A7" }
    }
  },
  {
    id: "ir_vizio_tv_nec",
    brand: "Vizio",
    deviceType: "tv",
    name: "Vizio SmartCast / E-Series (NEC 38kHz)",
    codes: {
      POWER: { command: "POWER", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF10EF" },
      VOLUME_UP: { command: "VOLUME_UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF40BF" },
      VOLUME_DOWN: { command: "VOLUME_DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DFC03F" },
      MUTE: { command: "MUTE", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF906F" },
      UP: { command: "UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF02FD" },
      DOWN: { command: "DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF827D" },
      LEFT: { command: "LEFT", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DFE01F" },
      RIGHT: { command: "RIGHT", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF609F" },
      OK: { command: "OK", frequencyKhz: 38, protocolType: "NEC", codeHex: "20DF22DD" }
    }
  },
  {
    id: "ir_roku_player_nec",
    brand: "Roku",
    deviceType: "streaming_box",
    name: "Roku Streaming Player (NEC 38kHz)",
    codes: {
      HOME: { command: "HOME", frequencyKhz: 38, protocolType: "NEC", codeHex: "57E3F00F" },
      BACK: { command: "BACK", frequencyKhz: 38, protocolType: "NEC", codeHex: "57E36699" },
      UP: { command: "UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "57E39867" },
      DOWN: { command: "DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "57E3CC33" },
      LEFT: { command: "LEFT", frequencyKhz: 38, protocolType: "NEC", codeHex: "57E37887" },
      RIGHT: { command: "RIGHT", frequencyKhz: 38, protocolType: "NEC", codeHex: "57E3B44B" },
      OK: { command: "OK", frequencyKhz: 38, protocolType: "NEC", codeHex: "57E354AB" },
      PLAY_PAUSE: { command: "PLAY_PAUSE", frequencyKhz: 38, protocolType: "NEC", codeHex: "57E332CD" }
    }
  },
  {
    id: "ir_apple_tv_nec",
    brand: "Apple",
    deviceType: "streaming_box",
    name: "Apple TV (A1294 / A1156 NEC 38kHz)",
    codes: {
      UP: { command: "UP", frequencyKhz: 38, protocolType: "NEC", codeHex: "77E1508A" },
      DOWN: { command: "DOWN", frequencyKhz: 38, protocolType: "NEC", codeHex: "77E1308A" },
      LEFT: { command: "LEFT", frequencyKhz: 38, protocolType: "NEC", codeHex: "77E1908A" },
      RIGHT: { command: "RIGHT", frequencyKhz: 38, protocolType: "NEC", codeHex: "77E1608A" },
      OK: { command: "OK", frequencyKhz: 38, protocolType: "NEC", codeHex: "77E1A08A" },
      MENU: { command: "MENU", frequencyKhz: 38, protocolType: "NEC", codeHex: "77E1C08A" },
      PLAY_PAUSE: { command: "PLAY_PAUSE", frequencyKhz: 38, protocolType: "NEC", codeHex: "77E1FA8A" }
    }
  },
  {
    id: "ir_comcast_xfinity_rc6",
    brand: "Xfinity",
    deviceType: "set_top_box",
    name: "Comcast Xfinity X1 / XR15 (RC6 36kHz)",
    codes: {
      POWER: { command: "POWER", frequencyKhz: 36, protocolType: "RC6", codeHex: "1004" },
      VOLUME_UP: { command: "VOLUME_UP", frequencyKhz: 36, protocolType: "RC6", codeHex: "1010" },
      VOLUME_DOWN: { command: "VOLUME_DOWN", frequencyKhz: 36, protocolType: "RC6", codeHex: "1011" },
      MUTE: { command: "MUTE", frequencyKhz: 36, protocolType: "RC6", codeHex: "100D" },
      GUIDE: { command: "GUIDE", frequencyKhz: 36, protocolType: "RC6", codeHex: "10CC" },
      UP: { command: "UP", frequencyKhz: 36, protocolType: "RC6", codeHex: "1058" },
      DOWN: { command: "DOWN", frequencyKhz: 36, protocolType: "RC6", codeHex: "1059" },
      LEFT: { command: "LEFT", frequencyKhz: 36, protocolType: "RC6", codeHex: "105A" },
      RIGHT: { command: "RIGHT", frequencyKhz: 36, protocolType: "RC6", codeHex: "105B" },
      OK: { command: "OK", frequencyKhz: 36, protocolType: "RC6", codeHex: "105C" }
    }
  }
];

export class IrDatabaseService {
  static getAllCodeSets(): IRCodeSet[] {
    return GLOBAL_IR_DATABASE;
  }

  static getCodeSetById(id: string): IRCodeSet | undefined {
    return GLOBAL_IR_DATABASE.find(set => set.id === id);
  }

  static getCodeSetsByBrand(brand: string): IRCodeSet[] {
    return GLOBAL_IR_DATABASE.filter(
      set => set.brand.toLowerCase() === brand.toLowerCase()
    );
  }
}

/*
  Hühnerhotel – Ziegentür-Reader
  ─────────────────────────────────────────────────────────────
  Hardware:  WT32-ETH01 (ESP32 mit LAN-Buchse)  +  FDX-B 134,2 kHz Lesemodul mit TTL-Ausgang
             (z. B. „WL-134“ / „134.2KHz FDX-B Reader Module“, 9600 Baud) + Spulen-Antenne
  Ablauf:    Modul liest das Halsband → ESP32 schickt die Chip-Nummer per LAN an den Pi
             → der Pi entscheidet (Ziege bekannt? Freigabe an?) und entriegelt über die LOGO.
             Der ESP32 selbst schaltet NICHTS – ohne Pi bleibt die Tür zu.

  Verdrahtung WT32-ETH01:
     Lesemodul TX  → IO5  (RX2)
     Lesemodul GND → GND,  VCC → 5V (je nach Modul, Datenblatt prüfen)
     LED grün      → IO14 (über 220 Ω nach GND)
     LED rot       → IO15 (über 220 Ω nach GND)

  Arduino IDE: Board „WT32-ETH01 Ethernet Module“ (oder „ESP32 Dev Module“), ESP32-Core 2.x oder 3.x.
*/
#include <Arduino.h>
#if ESP_ARDUINO_VERSION_MAJOR < 3
#include <WiFi.h>
#endif
#include <ETH.h>
#include <HTTPClient.h>

// ═══════════ Einstellungen ═══════════
const char* PI_HOST   = "192.168.0.10";        // IP-Adresse des Raspberry Pi
const int   PI_PORT   = 8088;                  // wie [ziegen] port in stallwache.ini
const char* TOKEN     = "HIER_KENNWORT";           // wie [ziegen] token in stallwache.ini
const char* READER_ID = "1";                   // falls später ein zweiter Reader dazukommt

const int RFID_RX = 5, RFID_TX = 17;           // Serial2 zum Lesemodul
const int LED_OK = 14, LED_NO = 15;
const unsigned long SAME_TAG_PAUSE_MS = 4000;  // derselbe Chip wird höchstens alle 4 s gemeldet

// ═══════════ LAN ═══════════
#define ETH_PHY_ADDR  1
#define ETH_PHY_POWER 16
#define ETH_PHY_MDC   23
#define ETH_PHY_MDIO  18
static bool ethUp = false;

void onEvent(arduino_event_id_t event) {
  switch (event) {
    case ARDUINO_EVENT_ETH_GOT_IP: ethUp = true;  Serial.printf("LAN ok, IP %s\n", ETH.localIP().toString().c_str()); break;
    case ARDUINO_EVENT_ETH_DISCONNECTED:
    case ARDUINO_EVENT_ETH_STOP:   ethUp = false; Serial.println("LAN getrennt"); break;
    default: break;
  }
}

// ═══════════ FDX-B dekodieren ═══════════
// Typisches Format der 134,2-kHz-Module (30 Byte):
//   0x02 | 10 Hex-Zeichen Kartennummer (niederwertig zuerst) | 4 Hex-Zeichen Ländercode (niederwertig zuerst)
//   | 1 Datenblock | 1 Tierkennung | 4 reserviert | 6 erweitert | 1 Prüfsumme | 1 inv. Prüfsumme | 0x03
// Ergebnis: "900 123456789012" (Land + 12-stellige Nummer)
String decodeFDXB(const uint8_t* b, size_t n) {
  if (n < 16) return "";
  auto rev = [&](size_t from, size_t len) {
    String s;
    for (int i = from + len - 1; i >= (int)from; i--) s += (char)b[i];
    return s;
  };
  String cardHex = rev(1, 10), countryHex = rev(11, 4);
  uint64_t card = strtoull(cardHex.c_str(), nullptr, 16);
  unsigned long country = strtoul(countryHex.c_str(), nullptr, 16);
  if (card == 0) return "";
  char out[32];
  snprintf(out, sizeof(out), "%03lu %012llu", country, (unsigned long long)card);
  return String(out);
}

uint8_t buf[64]; size_t len = 0; unsigned long lastByte = 0;

String readTag() {
  while (Serial2.available()) {
    uint8_t c = Serial2.read();
    lastByte = millis();
    if (c == 0x02) { len = 0; }
    if (len < sizeof(buf)) buf[len++] = c;
    if (c == 0x03 && len >= 16) {
      String t = decodeFDXB(buf, len);
      Serial.print("Rohdaten: "); for (size_t i = 0; i < len; i++) Serial.printf("%02X ", buf[i]); Serial.println();
      len = 0;
      return t;
    }
  }
  // Module ohne STX/ETX, die eine Textzeile mit Ziffern schicken
  if (len > 0 && millis() - lastByte > 80) {
    String s; for (size_t i = 0; i < len; i++) if (isalnum(buf[i]) || buf[i] == ' ') s += (char)buf[i];
    len = 0; s.trim();
    if (s.length() >= 8) return s;
  }
  return "";
}

// ═══════════ LED ═══════════
void blink(int pin, int times, int ms) {
  for (int i = 0; i < times; i++) { digitalWrite(pin, HIGH); delay(ms); digitalWrite(pin, LOW); delay(ms); }
}

// ═══════════ an den Pi melden ═══════════
void report(const String& tag) {
  if (!ethUp) { Serial.println("kein LAN – Chip nicht gemeldet"); blink(LED_NO, 5, 80); return; }
  HTTPClient http;
  String url = String("http://") + PI_HOST + ":" + PI_PORT + "/rfid?reader=" + READER_ID + "&token=" + TOKEN + "&tag=";
  String enc = tag; enc.replace(" ", "%20");
  http.setTimeout(4000);
  http.begin(url + enc);
  int code = http.GET();
  String body = code > 0 ? http.getString() : "";
  http.end();
  Serial.printf("Chip %s → HTTP %d %s\n", tag.c_str(), code, body.c_str());
  if (code == 200 && body.indexOf("\"ok\": true") >= 0) { digitalWrite(LED_OK, HIGH); delay(1500); digitalWrite(LED_OK, LOW); }
  else if (code == 200) blink(LED_NO, 3, 150);
  else blink(LED_NO, 6, 60);    // Pi nicht erreichbar
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_OK, OUTPUT); pinMode(LED_NO, OUTPUT);
  Serial2.begin(9600, SERIAL_8N1, RFID_RX, RFID_TX);
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  Network.onEvent(onEvent);
#else
  WiFi.onEvent(onEvent);
#endif
#if ESP_ARDUINO_VERSION_MAJOR >= 3
  ETH.begin(ETH_PHY_LAN8720, ETH_PHY_ADDR, ETH_PHY_MDC, ETH_PHY_MDIO, ETH_PHY_POWER, ETH_CLOCK_GPIO0_IN);
#else
  ETH.begin(ETH_PHY_ADDR, ETH_PHY_POWER, ETH_PHY_MDC, ETH_PHY_MDIO, ETH_PHY_LAN8720, ETH_CLOCK_GPIO0_IN);
#endif
  blink(LED_OK, 2, 150); blink(LED_NO, 2, 150);
  Serial.println("Hühnerhotel Ziegentür-Reader bereit");
}

String lastTag; unsigned long lastSent = 0, lastPing = 0;

void loop() {
  String tag = readTag();
  if (tag.length()) {
    if (tag != lastTag || millis() - lastSent > SAME_TAG_PAUSE_MS) {
      lastTag = tag; lastSent = millis();
      report(tag);
    }
  }
  // Lebenszeichen alle 5 Min., damit die App sieht, dass der Reader läuft
  if (ethUp && millis() - lastPing > 300000) {
    lastPing = millis();
    HTTPClient http; http.setTimeout(3000);
    http.begin(String("http://") + PI_HOST + ":" + PI_PORT + "/ping?token=" + TOKEN);
    http.GET(); http.end();
  }
  delay(10);
}

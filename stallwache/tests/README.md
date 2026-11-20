# Tests Hühnerhotel-Brücke
Simulierte LOGO (Modbus TCP, Port 15020) + Fake-Supabase (Port 18080). Aus diesem Ordner starten:
    python3 test_real.py      # echte Belegung (Q1 Relais, I4/I5)
    python3 test_bridge.py    # Grundfunktionen (alte Simulation mit Motor je Richtung)
    python3 test_ziegen.py / test_sp.py / test_neu.py / test_udp.py
shot.py / mobile.py rendern die App mit mock.js (Playwright + Chrome, Pfade ggf. anpassen).

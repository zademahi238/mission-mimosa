"""Read the ESP32 FlexiTac sensor using the official `flexitac` package.

Install:
    pip install "flexitac[examples]"

IMPORTANT: `flexitac-flash` (arduino-cli based) only knows how to build/flash
the stock AVR .ino template -- it can't flash a custom ESP-IDF project like
flexitac_esp32.c. Build and flash that yourself with `idf.py -p <port> flash`,
then just use FlexiTacSensor to read it, as below.

FlexiTacSensor defaults to rows=12, cols=32 (the "featured" 32x12 hardware).
Our firmware scans 16x32, so rows/cols must be passed explicitly -- this is
the one setting that has to match the #defines in flexitac_esp32.c.
"""

from __future__ import annotations

import argparse
import time

from flexitac import FlexiTacSensor


def main() -> int:
    parser = argparse.ArgumentParser(description="Stream frames from the ESP32 FlexiTac board.")
    parser.add_argument("--port", required=True, help="e.g. /dev/ttyUSB0")
    parser.add_argument("--rows", type=int, default=16)
    parser.add_argument("--cols", type=int, default=32)
    parser.add_argument("--baud", type=int, default=115_200, help="must match BAUD_RATE in the firmware")
    args = parser.parse_args()

    with FlexiTacSensor(args.port, rows=args.rows, cols=args.cols, baud=args.baud) as sensor:
        print("Calibrating baseline...")
        sensor.calibrate()
        print("Done. Streaming frames (Ctrl+C to stop).")

        started = time.monotonic()
        for i, frame in enumerate(sensor, start=1):
            fps = i / max(time.monotonic() - started, 1e-6)
            print(
                f"frame={i:6d} fps={fps:6.1f} "
                f"raw_max={int(frame.raw.max()):3d} "
                f"norm_max={float(frame.normalized.max()):.3f}"
            )


if __name__ == "__main__":
    raise SystemExit(main())

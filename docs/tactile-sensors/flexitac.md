# FlexiTac Tactile Sensor

**Mission Mimosa | Tactile Sensing**
---

## Overview

[FlexiTac](https://flexitac.github.io/) is a flexible tactile sensing platform designed for robotic applications. It provides spatial contact information that can complement visual observations during manipulation.

As part of **Mission Mimosa**, we are working on integrating FlexiTac into our visuo-tactile manipulation system. The goal is to use tactile information together with vision on our **SO101 robotic arms** and study its effect on manipulation policies.

The original FlexiTac setup uses an Arduino Nano. For our implementation, we are adapting the readout system to an **ESP32 DevKit**.

---

## Working Principle

FlexiTac uses a **piezoresistive sensing layer** between flexible electrode layers. When pressure is applied, the resistance of the sensing material changes. The readout electronics scan the sensing matrix and use these changes to determine where contact is occurring.

Our sensor has a **16 × 32 array**, giving a total of **512 sensing elements (taxels)**.

```text
        Applied Pressure
               ↓
        ┌─────────────┐
        │     FPC     │
        ├─────────────┤
        │ Piezoresistive│
        │     Layer   │
        ├─────────────┤
        │     FPC     │
        └──────┬──────┘
               ↓
         Readout Board
               ↓
             ESP32
             
```
![Flexitac Sensor](mission-mimosa/assets/flexitac.png)

For more details about the sensing mechanism, refer to the [FlexiTac paper](https://arxiv.org/abs/2604.28156).

---

##  Hardware Setup

Our current setup consists of:

| Component       | Details          |
| --------------- | ---------------- |
| Tactile sensor  | FlexiTac 16 × 32 |
| Readout board   | FlexiTac 16 × 32 |
| Microcontroller | ESP32 DevKit     |

The 16 × 32 readout board was ordered and received for the project. We first experimented with a manually assembled setup using jumper wires before moving towards a cleaner PCB-based design.

### ESP32 Pin Mapping

| Function             | ESP32 GPIO |
| -------------------- | ---------: |
| ADC Input            |    GPIO 36 |
| Shift Register Data  |    GPIO 14 |
| Shift Register Clock |    GPIO 27 |
| MUX S0               |    GPIO 32 |
| MUX S1               |    GPIO 33 |
| MUX S2               |    GPIO 12 |

![ Assembled FlexiTac Sensor](mission-mimosa/assets/IMG_3635.png)

*FlexiTac sensor used in the Mission Mimosa setup.*

---

## Software & Readout

The original FlexiTac implementation uses an Arduino Nano. We adapted the firmware to work with the ESP32 DevKit using **ESP-IDF**.

The current data pipeline is:

```text
FlexiTac
    ↓
Readout Board
    ↓
ESP32
    ↓
Serial
    ↓
Python Visualizer
```

The ESP32 handles the readout process and sends the sensor values to the host computer, where they can be visualized as a tactile map.

The firmware has been successfully flashed and the system is currently producing sensor readings.

![Firmware flashed](assets/output.jpg)

*ESP32 connected to the FlexiTac readout system.*

---

## Development Progress

### Sensor Assembly

We first assembled the FlexiTac sensor hardware and prepared it for connection to the readout electronics.

The **16 × 32 readout board** was then ordered and received for testing.

![Readout Board](assets/Board.jpg)

*FlexiTac sensor assembly.*

### Initial Readout Attempt

Before moving towards a PCB-based setup, we tried building the readout connections manually using jumper wires.

The setup did not work as expected. Since there were a large number of jumper-wire connections, debugging the system was difficult and there were many possible points of failure.

Because of this, we decided to move towards designing our own PCB.

![Jumper Wire Setup](mission-mimosa/assets/jumper_wire.png)

*Initial manually wired readout setup.*

### ESP32 Integration

We then adapted the firmware for the ESP32 DevKit.

So far:

* Firmware has been successfully flashed.
* ESP32 communication with the readout system is working.
* Sensor readings are being received.
* The readings can be visualized on the PC.

---

## Current Issue

The main issue we are currently working on is **partial sensor response**.

Only approximately half of the sensing area is responding to applied pressure, while the remaining region does not show the expected readings.

The sensor appears to be divided into two regions:

```text
┌──────────────────────────┐
│                          │
│    Responsive Region     │
│                          │
├──────────────────────────┤
│                          │
│   Non-responsive Region  │
│                          │
└──────────────────────────┘
```

The exact cause has not been identified yet.


*Current tactile visualization showing the partially responsive sensing area.*

---

## Custom PCB

We are currently designing our own PCB for the FlexiTac readout system.

The main reason for moving away from the jumper-wire setup is to reduce wiring complexity and make the system easier to debug and reproduce.

**Status:** PCB design in progress.


---

## Integration with SO101

Once the sensor is working reliably, the next step is to deploy FlexiTac on our **SO101 robotic arms**.

The planned pipeline is:

```text
       Camera
          +
      FlexiTac
          ↓
 Visual + Tactile Data
          ↓
    Learning Policy
          ↓
        SO101
```

The [LeFlexiTac documentation](https://tna001-ai.github.io/LeFlexiTac/docs.html) provides a useful reference for integrating FlexiTac with a robotic manipulation setup. It covers the hardware setup, tactile sensor integration, tactile stream verification, and the overall training/reproduction workflow.

### Tactile Stream

The LeFlexiTac setup uses **PyFlexiTac** for flashing, checking the tactile stream and visualizing the sensor as a heatmap. Their documentation also describes a 2,000,000-baud tactile stream.

For reference:

```bash
pip install "flexitac[examples]"
```

We will adapt this workflow to our ESP32-based setup as needed.

### Rollout

Once the tactile data pipeline and policy are ready, the trained policy will be deployed on the SO101 using the corresponding LeRobot rollout workflow.


---

## Policy Training & Rollout

Once FlexiTac is fully integrated with the SO101, we plan to train and compare **ACT** and **Diffusion Policy (DP)** using visual + tactile observations.

The main comparison will be:

```text
Vision only  →  ACT / DP
Vision + Tactile → ACT / DP
```


---

## References

* [FlexiTac Project](https://flexitac.github.io/)
* [FlexiTac Paper — arXiv:2604.28156](https://arxiv.org/abs/2604.28156)
* [FlexiTac Hardware Repository](https://github.com/FlexiTac/FlexiTac_Hardware_Repo)
* [LeFlexiTac Documentation](https://tna001-ai.github.io/LeFlexiTac/docs.html)

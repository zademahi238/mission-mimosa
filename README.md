# Mission Mimosa

<p align="center">
  <b>A Visuo-Tactile Manipulation System</b>
</p>

<p align="center">
  <i>Giving robots the ability to see, feel, and manipulate.</i>
</p>

---

## Overview

**Mission Mimosa** is a visuo-tactile manipulation system that combines **vision and touch** to enable robots to perform manipulation tasks with contact-aware feedback.

The system integrates **FlexiTac**, **LeRobot**, **LeFlexiTac**, and a **B-spline Policy (BSP)** into a unified manipulation pipeline.

---

## System Pipeline

<p align="center">
  <img src="assets/architecture.png" width="800">
</p>

```text
Vision + Tactile
       ↓
   LeFlexiTac
       ↓
    BSP Policy
       ↓
     SO-101
       ↓
  Manipulation
```

---

## Key Modules

###  FlexiTac

**FlexiTac** is a low-cost, flexible tactile sensing system that provides the robot with a sense of touch.

In Mission Mimosa, FlexiTac provides the tactile observations used during manipulation.

For hardware assembly, firmware, and sensor setup:

→ **[FlexiTac](./FlexiTac)**

---

### LeRobot + SO-10x Arms

**LeRobot** is an open-source framework for robot learning and manipulation. Mission Mimosa uses it with the **SO-101** robotic arm for data collection, control, and policy deployment.

For installation and SO-101 setup:

→ **[LeRobot](./lerobot)**

---

###  LeFlexiTac

**LeFlexiTac** integrates FlexiTac tactile sensing into the LeRobot framework, allowing robotic policies to learn from **vision, touch, and robot state** together.

For the complete integration and setup:

→ **[LeFlexiTac](./LeFlexiTac)**

---

### B-spline Policy

**B-spline Policy (BSP)** represents robot actions as smooth continuous B-spline trajectories instead of discrete action sequences, enabling smoother and more flexible manipulation.

For the policy implementation and setup:

→ **[BSP](./BSP)**

---

## Getting Started

Set up the components in the following order:

**1.** [FlexiTac](./FlexiTac) → Tactile hardware
**2.** [LeRobot](./lerobot) → SO-101 & robot learning
**3.** [LeFlexiTac](./LeFlexiTac) → Vision + tactile integration
**4.** [BSP](./BSP) → Manipulation policy

---

## Referencess

Mission Mimosa builds upon:

* [FlexiTac](https://github.com/FlexiTac/FlexiTac_Hardware_Repo)
* [LeRobot](https://github.com/huggingface/lerobot)
* [LeFlexiTac](https://github.com/neubotix/lerobot_tactile)
* [B-spline Policy](https://github.com/B-spline-policy/bspline-policy)

---

<p align="center">
  <i>Mission Mimosa</i>
</p>

  


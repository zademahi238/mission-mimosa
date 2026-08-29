# Mission Mimosa

**A Visuo-Tactile Manipulation System**

*Giving robots a sense of touch.*
---

## Overview

**Mission Mimosa** explores visuo-tactile manipulation on the **SO-101** robotic arm by combining camera observations with tactile sensing.

The project investigates whether tactile information improves manipulation performance by comparing **task-completion success rates with and without tactile sensing** across different robot-learning policies.
---

## Key Components
### FlexiTac

**FlexiTac** provides the tactile sensing hardware used to capture contact information during manipulation.

→ [`flexitac/`](./flexitac)

### LeRobot

**LeRobot** provides the robot-learning framework and interface for the **SO-101**.

→ [`lerobot/`](./lerobot)

### B-Spline Policy

**B-Spline Policy (BSP)** represents robot actions as smooth continuous trajectories for manipulation.

→ [`bspline/`](./bspline)

### LeFlexiTac

**LeFlexiTac** integrates tactile sensing with the LeRobot framework, enabling visuo-tactile observations for robot learning.

→ [`leflexitac/`](./leflexitac)

---

## Policies

Mission Mimosa explores multiple robot-learning policies, including:

- **ACT**
- **B-Spline Policy**
- **Diffusion**
---

## Experimental Goal

The project evaluates whether tactile sensing improves robot manipulation by comparing:

| Setup | Vision | Tactile |
|---|:---:|:---:|
| Vision-only | ✓ | ✗ |
| Vision + tactile | ✓ | ✓ |

Performance is evaluated using **task-completion success rate** across different policies.
---

## Repository Structure

```text
mission-mimosa/
├── README.md
├── .gitmodules
├── lerobot/
├── leflexitac/
├── flexitac/
└── bspline/



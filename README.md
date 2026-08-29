# Mission Mimosa

### A Visuo-Tactile Manipulation System

*Giving robots a sense of touch.*

---

## Overview

**Mission Mimosa** explores **visuo-tactile manipulation** on the **SO-101 robotic arm**, combining visual observations with tactile sensing for robot manipulation.

The main objective is to investigate:

> **Does tactile information improve robot manipulation performance?**

To answer this, we compare **task-completion success rates with and without tactile sensing** across different robot-learning policies.

---

## Components

### SO-101

The **SO-101** robotic arm is used as the primary platform for collecting demonstrations and evaluating learned manipulation policies.

### FlexiTac

**FlexiTac** provides the tactile sensing hardware used to capture contact information during manipulation.

→ [`flexitac/`](./flexitac)

### LeFlexiTac

**LeFlexiTac** integrates tactile sensing with the **LeRobot** framework, enabling tactile observations to be incorporated into robot-learning workflows.

→ [`leflexitac/`](./leflexitac)

### LeRobot

**LeRobot** provides the robotics framework used for data collection, policy training, and deployment on the SO-101.

→ [`lerobot/`](./lerobot)

---

## Policies

Mission Mimosa explores multiple approaches for learning robot manipulation:

* **[ACT](./docs/policies/act.md)** — Action Chunking with Transformers for learning robot actions from demonstrations.

* **[B-Spline Policy](./docs/imitation-learning/bspline_policy_updated.md)** — Represents robot actions as smooth, continuous trajectories for manipulation.

* **[Diffusion Policy](./docs/policies/diffusion.md)** — Uses diffusion-based action generation for visuomotor control.

* **[SmolVLA](https://huggingface.co/blog/smolvla)** — A compact Vision-Language-Action model designed for efficient real-world robotic manipulation. SmolVLA-450M combines a vision-language model with a flow-matching action expert and is designed to run on relatively affordable hardware, including the SO-101.

Comparing these policies allows us to study how different learning approaches perform with visual information alone and when tactile information is introduced.

---

## Experiment

The core experiment compares two observation settings:

| Setup                | Vision | Tactile |
| :------------------- | :----: | :-----: |
| **Vision Only**      |    ✓   |    —    |
| **Vision + Tactile** |    ✓   |    ✓    |

Each setup is evaluated using **task-completion success rate** across manipulation tasks and different learning policies.

```chart Success Rate Comparison
[
  {
    "label": "ACT",
    "bars": [
      { "label": "50 eps", "value": 80, "series": "Vision" },
      { "label": "50 eps", "value": 90, "series": "Vision + Tactile" },
      { "label": "20 eps", "value": 50, "series": "Vision + Tactile" }
    ]
  },
  {
    "label": "SmolVLA",
    "bars": [
      { "label": "50 eps", "value": 70, "series": "Vision" },
      { "label": "20 eps", "value": 30, "series": "Vision" },
      { "label": "50 eps", "value": 50, "series": "Vision + Tactile" },
      { "label": "20 eps", "value": 70, "series": "Vision + Tactile" }
    ]
  }
]
```

This comparison helps isolate the contribution of tactile sensing and determine whether contact information leads to more reliable manipulation.

---

## Research Areas

Mission Mimosa focuses on the intersection of:

**Computer Vision · Tactile Sensing · Robot Learning · Robotic Manipulation**

The broader goal is to understand how robots can combine **visual and tactile information** to make better decisions during physical interaction.

---

## Repository Structure

```text
mission-mimosa/
│
├── assets/                  # Project media and visual assets
├── docs/                    # Documentation and research notes
│
├── flexitac/                # FlexiTac tactile sensing
├── leflexitac/              # LeRobot + tactile integration
├── lerobot/                 # Robot learning framework
├── bspline/                 # B-Spline policy
│
└── README.md
```

---

### Mission Mimosa

**Vision provides sight.
Tactile sensing provides touch.**

*Mission Mimosa explores how combining both can improve robotic manipulation.*

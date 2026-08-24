# ACT (Action Chunking with Transformers)

## Overview
ACT is one of the imitation learning approaches implemented for the SO-101 arm. Instead of predicting one action at a time, it predicts a short **chunk** of future actions in one go, then executes them before predicting the next chunk. This reduces the small errors that build up over time when a robot predicts actions one step at a time.

Currently trained and tested using **vision-only** input (RGB camera feed). Tactile input (FlexiTac, eFlesh) will be added later.

---

## Why ACT?
- Predicting a chunk of actions at once (instead of one at a time) makes the robot's motion smoother and less jittery.
- Reduces "compounding error" — small mistakes that pile up when a policy only looks one step ahead.
- Good for tasks that need precise, human-like motion, since it's trained directly on demonstration trajectories.

---

## How It Works (Simple Explanation)
1. The policy looks at the current observation (camera image + robot state).
2. Instead of predicting the next single action, it predicts a whole short sequence of future actions at once (a "chunk").
3. The robot executes some of these actions, then looks again and predicts the next chunk.
4. Overlapping chunks are blended together so the motion stays smooth instead of jumping between chunks.

*(Add a simple diagram/GIF here showing the pipeline: Camera → Encoder → Transformer → Action Chunk)*

---

## Setup / Architecture
> Fill in specifics — e.g. vision encoder used, chunk size, how many cameras, training data, etc.

- **Input:** 
- **Vision Encoder:** 
- **Action space:** 
- **Chunk size:** 
- **Training data:** 
- **Training steps:** 

---

## Media

### Demo / Rollout Videos
> Add video/GIF of the arm executing tasks using this policy.

### Architecture Diagram
> Add a simple visual of the pipeline.

---

## Changes / Iteration Log
> Keep this updated as you tweak things — helps track what worked and what didn't.

| Date | Change | Reason / Result |
|---|---|---|
|  |  |  |

---

## Known Issues / Limitations
> e.g. sensitive to chunk size, needs good camera framing, etc.

-

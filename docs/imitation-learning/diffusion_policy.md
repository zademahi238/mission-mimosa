# Diffusion Policy

## Overview
Diffusion Policy is one of the imitation learning approaches implemented for the SO-101 arm. Instead of directly predicting an action, it learns to generate actions by gradually "denoising" random noise into a valid action sequence — similar to how image diffusion models generate images. This makes it good at handling multiple possible correct actions for the same situation (multimodal behavior), which is common in human demonstrations.

Currently trained and tested using **vision-only** input (RGB camera feed). Tactile input (FlexiTac, eFlesh) will be added later.

---

## Why Diffusion Policy?
- Handles multimodal demonstrations well (e.g. two equally valid ways to grasp an object) instead of averaging them into a bad action.
- Tends to produce smoother, more stable action trajectories compared to simple regression-based policies.
- Well suited for contact-rich tasks, which is relevant once tactile sensing is added.

---

## How It Works (Simple Explanation)
1. The policy looks at the current observation (camera image + robot state).
2. It starts with a random noisy action sequence.
3. Over several denoising steps, it refines the noise into a clean, usable action sequence conditioned on the observation.
4. The robot executes the resulting action(s).


## Conditioning on What the Camera Sees
The model only predicts the **action** — it never tries to predict what the camera will see next. It simply looks at the current image and asks "given this, what should the noisy action turn into?" Not having to also guess future images makes the model faster and easier to train.

This can be written as:

**Cleaning step** — take the current noisy action, remove a bit of predicted noise, add a small amount of fresh randomness:

$$A_t^{k-1} = \alpha \left( A_t^k - \gamma \, \varepsilon_\theta(O_t, A_t^k, k) + \mathcal{N}(0, \sigma^2 I) \right)$$

Here $A_t^k$ is the action at cleaning step $k$, $O_t$ is the current observation (image + robot state), and $\varepsilon_\theta$ is the model's guess of the noise to remove.

**Training goal** — during training, we add random noise $\varepsilon^k$ to a real action and let the model guess it back, given the observation:

$$L = \text{MSE}\left(\varepsilon^k, \, \varepsilon_\theta(O_t, A_t^0 + \varepsilon^k, k)\right)$$

The better the model's guessed noise matches the real noise, the lower the loss.

In short: *look at the image, guess the noise, remove it, repeat.*

---
## Setup / Architecture
> Fill in specifics — e.g. vision encoder used, number of diffusion steps, action horizon, observation horizon, etc.

- **Input:** RGB images + joint positions
- **Vision Encoder:** ResNet-18
- **Action space:** Joint positions 
- **Prediction/Action horizon:** 8–16 steps
- **Training data:** 50 episodes of cup stacking
- **Training steps:** 100k

---

## Media

### Demo / Rollout Videos
> Add video/GIF of the arm executing tasks using this policy.
![Diffusion Policy rollout demo](../../assets/Diffusion_inference.gif)
### Architecture Diagram
> Add a simple visual of the pipeline.
![Denoising process](../../assets/Diffusion_pipeline.png)
---

## Changes / Iteration Log
> Keep this updated as you tweak things — helps track what worked and what didn't.

| Date | Change | Reason / Result |
|---|---|---|
|  | Switched to a fixed camera setup instead of a shifty/handheld one | Performance improved — a stable viewpoint made it easier for the model to learn consistent visual cues |
|  | Switched to DDIM sampler for inference | Noticeably better results, likely due to faster and more stable sampling compared to the standard sampler |
---

## Known Issues / Limitations
> e.g. slow inference due to multiple denoising steps, sensitive to hyperparameters, etc.
This policy's inference is very jerky.
This policy needs a fixed setup and is bad to changes.
-

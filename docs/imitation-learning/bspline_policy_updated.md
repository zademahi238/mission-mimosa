# B-Spline Policy

## Overview

The B-Spline approach changes **how the action trajectory is represented**, rather than replacing the underlying policy architecture. Instead of directly predicting raw action points, the trajectory is represented using a small set of **B-Spline control points** and knot values. A smooth trajectory is then reconstructed from this representation.

In this project, the B-Spline approach was integrated into the LeRobot environment and used with the SO-101 arm on top of two imitation learning policies:

- **B-Spline ACT**
- **B-Spline Diffusion Policy (DP)**

The overall process is:

```text
Demonstration trajectory
        ↓
Convert trajectory to B-Spline representation
        ↓
Control points + knot values
        ↓
Policy predicts B-Spline representation
        ↓
Reconstruct continuous trajectory
        ↓
Execute trajectory on SO-101
```

---

## Why B-Spline?

Instead of predicting every action point independently, B-Splines provide a continuous representation of the trajectory.

The main advantages are:

- Produces smoother and more continuous trajectories.
- Represents a trajectory using fewer control points.
- Reduces the amount of action information the policy needs to predict.
- Allows the same trajectory to be executed at different temporal scales.
- Provides better control over the smoothness and frequency of the generated motion.

---

## How B-Spline Works

### Trajectory to B-Spline

A demonstration normally contains a sequence of discrete actions:

$$
A = \{a_0, a_1, ..., a_T\}
$$

Instead of using this complete sequence directly, the trajectory is first fitted to a B-Spline representation.

```text
Discrete demonstration trajectory
              ↓
        B-Spline fitting
              ↓
    Control points + knots
              ↓
     Continuous trajectory
```

<!-- IMAGE: Demonstration trajectory converted into B-Spline representation -->
<!-- PATH: <add_image_path_here> -->

The policy then predicts the B-Spline representation, which is reconstructed into a trajectory during inference.

### B-Spline Representation

A B-Spline trajectory is represented using a set of control points and a knot vector.

For control points

$$
c_0, c_1, \ldots, c_N
$$

the continuous action at normalized time $u$ is given by:

$$
a(u) = \sum_{i=0}^{N} N_{i,p}(u) \cdot c_i
$$

where:

- $a(u)$ is the continuous action at normalized time $u$.
- $c_i$ is the $i$-th B-Spline control point.
- $N_{i,p}(u)$ is the $i$-th B-Spline basis function of degree $p$.
- $p$ is the spline degree.
- $u \in [0,1]$ is the normalized trajectory time.
- $N$ is the number of control points minus one.

For the implementation used in this project:

- **Spline degree:** Add the spline degree used in the experiment.
- **Number of control points:** Add project-specific value.
- **Knot configuration:** Add project-specific configuration.

<!-- IMAGE: B-Spline control points and resulting continuous trajectory -->
<!-- PATH: <add_image_path_here> -->

### B-Spline Basis Functions

The B-Spline basis functions are defined recursively using the Cox-de Boor formulation:

$$
N_{i,0}(u)=
\begin{cases}
1, & t_i \leq u < t_{i+1} \\
0, & \text{otherwise}
\end{cases}
$$

For $p > 0$:

$$
N_{i,p}(u)
=
\frac{u-t_i}{t_{i+p}-t_i}N_{i,p-1}(u)
+
\frac{t_{i+p+1}-u}{t_{i+p+1}-t_{i+1}}
N_{i+1,p-1}(u)
$$

Terms with zero denominators are treated as zero.

The final trajectory is obtained by evaluating $a(u)$ at the required normalized time points.

<!-- IMAGE: B-Spline basis functions -->
<!-- PATH: <add_image_path_here> -->

### B-Spline Trajectory Reconstruction

The control points predicted by the policy are converted back into a continuous action trajectory by evaluating the B-Spline at a sequence of normalized time values.

```text
Predicted control points
          ↓
    Knot configuration
          ↓
Evaluate B-Spline at u ∈ [0,1]
          ↓
Continuous action trajectory
          ↓
Action points sent to robot
```

<!-- IMAGE: B-Spline reconstruction from control points -->
<!-- PATH: <add_image_path_here> -->

---

# Integration With LeRobot

The original B-Spline policy was not directly trained and inferred on the SO-101 using LeRobot. We therefore integrated the B-Spline approach into the LeRobot environment.

The integration connects the policy output to the SO-101 action interface:

```text
Observation
    ↓
ACT / Diffusion Policy
    ↓
B-Spline representation
    ↓
B-Spline reconstruction
    ↓
Continuous action trajectory
    ↓
LeRobot
    ↓
SO-101
```

<!-- IMAGE: B-Spline integration with LeRobot and SO-101 -->
<!-- PATH: <add_image_path_here> -->

This allowed the B-Spline approach to be evaluated using the same SO-101 and LeRobot environment used for the other imitation learning policies.

---

# Experimental Setup

| Component | Configuration |
|---|---|
| Robot | SO-101 |
| Environment | LeRobot |
| Policy 1 | B-Spline ACT |
| Policy 2 | B-Spline Diffusion Policy |
| Dataset | Add dataset |
| Camera | Add camera configuration |
| GPU | Add GPU |
| Control frequency | Add value |
| Spline degree | Add value |
| Number of control points | Add value |

<!-- IMAGE: Experimental hardware / SO-101 setup -->
<!-- PATH: <add_image_path_here> -->

<!-- VIDEO: Physical SO-101 setup / demonstration -->
<!-- PATH: <add_video_path_here> -->

---

# B-Spline + ACT

## Overview

B-Spline ACT combines the ACT architecture with the B-Spline action representation.

ACT processes the visual and robot-state observations, but instead of directly producing the raw action trajectory, its output is represented using B-Spline parameters.

## Pipeline

```text
RGB Image + Robot State
          ↓
     Vision Encoder
          ↓
     ACT Transformer
          ↓
 B-Spline Control Points
          ↓
 B-Spline Reconstruction
          ↓
 Smooth Action Trajectory
          ↓
        SO-101
```

<!-- IMAGE: B-Spline ACT architecture -->
<!-- PATH: <add_image_path_here> -->

## Configuration

- **Training data:** Add project-specific training details here.
- **Training steps:** Add project-specific training details here.
- **Spline degree:** Add the spline degree used in the experiment.
- **B-Spline chunk size:** Add value.

## Training

> Training command to be added.

```bash
<BSPLINE_ACT_TRAINING_COMMAND>
```

## Deployment / Inference

The trained B-Spline ACT policy is deployed through the integrated LeRobot environment.

```bash
lerobot-rollout \
    --strategy.type=episodic \
    --policy.path=<path_to_bspline_act_checkpoint> \
    --policy.speed_up=<speed_up> \
    --robot.type=<robot_type> \
    --robot.port=<robot_port> \
    --robot.id=<robot_id> \
    --robot.cameras='{<camera_configuration>}' \
    --dataset.repo_id=<dataset_repo_id> \
    --dataset.single_task="<task_description>" \
    --dataset.num_episodes=<num_episodes> \
    --fps=<fps> \
    --device=<cuda_or_cpu>
```

## Rollout

<!-- VIDEO: B-Spline ACT SO-101 rollout -->
<!-- PATH: <add_video_path_here> -->

<!-- VIDEO: B-Spline ACT successful task execution -->
<!-- PATH: <add_video_path_here> -->

## Results

<!-- IMAGE: B-Spline ACT trajectory/result -->
<!-- PATH: <add_image_path_here> -->

<!-- IMAGE: B-Spline ACT action trajectory compared with demonstration -->
<!-- PATH: <add_image_path_here> -->

---

# B-Spline + Diffusion Policy

## Overview

B-Spline DP combines Diffusion Policy with the B-Spline action representation.

Instead of denoising raw action points, the diffusion policy predicts the B-Spline representation of the trajectory. The predicted representation is then reconstructed into a continuous trajectory for execution.

## Pipeline

```text
RGB Image + Robot State
          ↓
    Diffusion Policy
          ↓
 B-Spline Representation
          ↓
 B-Spline Reconstruction
          ↓
 Smooth Action Trajectory
          ↓
        SO-101
```

<!-- IMAGE: B-Spline Diffusion Policy architecture -->
<!-- PATH: <add_image_path_here> -->

## Configuration

- **Training data:** Add project-specific training details here.
- **Training steps:** Add project-specific training details here.
- **Spline degree:** Add the spline degree used in the experiment.
- **B-Spline chunk size:** Add value.

## Training

> Training command to be added.

```bash
<BSPLINE_DP_TRAINING_COMMAND>
```

---

## Deployment / Inference

### Original Inference

The original B-Spline DP rollout used the standard inference configuration:

```bash
lerobot-rollout \
    --strategy.type=episodic \
    --policy.path=<path_to_pretrained_checkpoint> \
    --policy.speed_up=<speed_up> \
    --robot.type=<robot_type> \
    --robot.port=<robot_port> \
    --robot.id=<robot_id> \
    --robot.cameras='<camera_configuration>' \
    --dataset.repo_id=<dataset_repo_id> \
    --dataset.single_task="<task_description>" \
    --dataset.num_episodes=<num_episodes> \
    --fps=<fps> \
    --device=<device>
```

---

# Hyperparameter Tuning

The B-Spline DP policy was tuned to improve trajectory quality and execution behavior.

The main changes were:

- Changed the **noise scheduler to DDIM**.
- Set **10 inference steps**.
- Added an **alignment error threshold**.
- Added an **alignment maximum fraction**.
- Added a **replan margin**.

---

## Segment Alignment

During inference, consecutive B-Spline trajectory segments need to be aligned so that the transition between them remains continuous.

Let the end of the current trajectory segment be represented by:

$$
a_{\text{current}}(u)
$$

and a candidate point in the next predicted trajectory be represented by:

$$
a_{\text{next}}(v)
$$

The alignment error between the two trajectory states can be expressed as:

$$
E(u,v)
=
\left\|
a_{\text{current}}(u)
-
a_{\text{next}}(v)
\right\|_2
$$

The alignment procedure searches over a permitted portion of the next trajectory and selects the candidate alignment with the lowest error:

$$
(u^*,v^*)
=
\underset{(u,v)\in\mathcal{S}}{\operatorname{argmin}}
\;
E(u,v)
$$

where $\mathcal{S}$ is the search region defined by `align_max_fraction`.

An alignment is accepted only when:

$$
E(u^*,v^*)
\leq
\texttt{align\_error\_threshold}
$$

This allows the newly generated B-Spline segment to be connected to the currently executing segment without introducing a large discontinuity.

### Alignment Process

```text
Current B-Spline segment
          ↓
   Find current endpoint
          ↓
Predicted next B-Spline segment
          ↓
 Search permitted fraction
          ↓
Calculate alignment error
          ↓
 Select minimum-error candidate
          ↓
 Error ≤ threshold?
       /       \
     Yes        No
      ↓          ↓
   Align      Reject /
   segments   replan
```

<!-- IMAGE: B-Spline segment alignment visualization -->
<!-- PATH: <add_image_path_here> -->

<!-- IMAGE: Alignment search region and selected alignment point -->
<!-- PATH: <add_image_path_here> -->

<!-- VIDEO: Segment alignment during SO-101 execution -->
<!-- PATH: <add_video_path_here> -->

### Alignment Parameters

#### Align Error Threshold

`align_error_threshold` defines the maximum amount of error allowed between the two B-Spline segments being aligned.

An alignment candidate is accepted only when its alignment error is below this threshold.

**Configured value:** Add value.

#### Align Max Fraction

`align_max_fraction` defines how much of the predicted trajectory can be searched when looking for a valid alignment.

The alignment procedure searches within this fraction and selects the candidate with the lowest alignment error.

**Configured value:** Add value.

#### Replan Margin

`replan_margin` determines how early the policy begins preparing the next trajectory segment relative to the current segment.

A larger margin causes replanning to begin earlier, providing more time for the next B-Spline segment to be generated and aligned before the current segment is exhausted.

**Configured value:** Add value.

---

## Alignment Example

The following visualization should show two consecutive B-Spline trajectories, the search region, the selected alignment point, and the resulting continuous trajectory.

<!-- IMAGE: Alignment search region, candidate points, selected minimum-error alignment -->
<!-- PATH: <add_image_path_here> -->

<!-- IMAGE/GIF: Before and after segment alignment -->
<!-- PATH: <add_media_path_here> -->

---

# Before Hyperparameter Tuning

<!-- IMAGE: B-Spline DP trajectory before hyperparameter tuning -->
<!-- PATH: <add_image_path_here> -->

<!-- VIDEO: B-Spline DP execution before hyperparameter tuning -->
<!-- PATH: <add_video_path_here> -->

Describe the observed behavior before tuning here.

---

# After Hyperparameter Tuning

The tuned configuration uses DDIM sampling, 10 inference steps, and the new B-Spline alignment and replanning parameters.

<!-- IMAGE: B-Spline DP trajectory after hyperparameter tuning -->
<!-- PATH: <add_image_path_here> -->

<!-- VIDEO: B-Spline DP execution after hyperparameter tuning -->
<!-- PATH: <add_video_path_here> -->

Describe the observed improvement here.

---

# Before vs After

| Parameter | Before Tuning | After Tuning |
|---|---|---|
| Noise scheduler | Previous scheduler | DDIM |
| Inference steps | Previous value | 10 |
| Align error threshold | Not used | Tuned value |
| Align max fraction | Not used | Tuned value |
| Replan margin | Not used | Tuned value |

### Trajectory Comparison

<!-- IMAGE: Before vs after trajectory comparison -->
<!-- PATH: <add_image_path_here> -->

### Execution Comparison

<!-- VIDEO: Before vs after SO-101 execution -->
<!-- PATH: <add_video_path_here> -->

| Metric / Behavior | Before | After |
|---|---|---|
| Trajectory smoothness | Add observation | Add observation |
| Segment transitions | Add observation | Add observation |
| Replanning behavior | Add observation | Add observation |
| Execution stability | Add observation | Add observation |
| Task success | Add result | Add result |

---

# Tuned Inference Command

```bash
lerobot-rollout \
    --strategy.type=episodic \
    --policy.path=<path_to_pretrained_checkpoint> \
    --policy.speed_up=<speed_up> \
    --policy.noise_scheduler_type=<scheduler_type> \
    --policy.num_inference_steps=<num_inference_steps> \
    --policy.align_error_threshold=<alignment_error_threshold> \
    --policy.align_max_fraction=<alignment_search_fraction> \
    --policy.replan_margin=<replan_margin> \
    --robot.type=<robot_type> \
    --robot.port=<robot_port> \
    --robot.id=<robot_id> \
    --robot.cameras='<camera_configuration>' \
    --dataset.repo_id=<dataset_repo_id> \
    --dataset.single_task="<task_description>" \
    --dataset.num_episodes=<num_episodes> \
    --fps=<fps> \
    --device=<device>
```

---

# Execution Speed

The continuous B-Spline trajectory can be temporally scaled, allowing the same trajectory to be executed at different speeds.

## 1× Execution

<!-- VIDEO: 1× B-Spline execution -->
<!-- PATH: <add_video_path_here> -->

<!-- IMAGE: 1× B-Spline trajectory -->
<!-- PATH: <add_image_path_here> -->

## 2× Execution

<!-- VIDEO: 2× B-Spline execution -->
<!-- PATH: <add_video_path_here> -->

<!-- IMAGE: 2× B-Spline trajectory -->
<!-- PATH: <add_image_path_here> -->

## 1× vs 2× Comparison

<!-- IMAGE: 1× vs 2× trajectory comparison -->
<!-- PATH: <add_image_path_here> -->

Describe how temporal scaling affects the execution here.

---

# Changes / Iteration Log

The iteration log records the hyperparameter changes made during B-Spline DP experiments.

| Change | Previous | New | Purpose / Result |
|---|---|---|---|
| Noise scheduler | Previous scheduler | DDIM | Changed diffusion sampling behavior |
| Inference steps | Previous value | 10 | Reduced number of denoising steps |
| Align error threshold | Not used | Tuned value | Limit error between aligned B-Spline segments |
| Align max fraction | Not used | Tuned value | Define the search range for finding the lowest-error alignment |
| Replan margin | Not used | Tuned value | Start replanning before the current action segment is exhausted |

---

# Implementation Details

Add the actual code locations used for the B-Spline implementation here.

## Policy Files

```text
<actual_policy_file_path>
```

## B-Spline Representation

```text
<actual_bspline_file_path>
```

## Reconstruction

```text
<actual_reconstruction_file_path>
```

## Alignment / Replanning

```text
<actual_alignment_file_path>
```

## LeRobot Integration

```text
<actual_lerobot_integration_file_path>
```

<!-- IMAGE: Code / implementation architecture -->
<!-- PATH: <add_image_path_here> -->

---

# Known Issues / Limitations

- The B-Spline implementation required integration with the LeRobot environment for use with the SO-101.
- Trajectory quality is sensitive to B-Spline and diffusion hyperparameters.
- Alignment and replanning parameters affect the continuity and stability of the resulting trajectory.
- Higher execution speeds can make trajectory tracking more demanding for the robot.
- Add any additional implementation-specific limitations here.

---

# References

- **B-Spline Policy:** B-spline action representations for accelerating manipulation policies.
- **ACT:** Action Chunking with Transformers.
- **Diffusion Policy:** Visuomotor Policy Learning via Action Diffusion.
- **LeRobot:** Hugging Face LeRobot.

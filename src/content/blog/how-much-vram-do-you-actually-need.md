---
title: "VRAM Cheat Sheet for Local LLMs"
date: 2026-08-04
description: "A hardware cheat sheet comparing model parameter count, quantization levels, and required GPU VRAM."
author: "Mamy Rakotomalala "
---

Required VRAM depends directly on model parameter count, quantization level, and KV cache context length.

### WHY IT MATTERS
Sizing GPU hardware incorrectly leads to slow CPU offloading or expensive over-provisioning. Knowing exact memory limits ensures **optimal performance per dollar for local inference**.

### GO DEEPER
- **8B parameter models:** Require **6–8 GB VRAM** using **Q4_K_M** 4-bit quantization.
- **14B–15B parameter models:** Need **9–12 GB VRAM** for smooth 4-bit local chat.
- **32B–35B parameter models:** Demand **20–24 GB VRAM**, ideal for single **RTX 4090** cards.
- **70B parameter models:** Require **40–48 GB VRAM**, necessitating dual-GPU or Mac setups.
- **KV cache headroom:** Reserve **1–2 GB extra VRAM** to prevent out-of-memory crashes on long context.
- **CPU offload penalty:** Spilling VRAM to system RAM drops generation speeds by **5–10x**.

### THE BOTTOM LINE
Size your VRAM for 4-bit quantization plus 2GB of headroom to avoid massive CPU speed penalties.

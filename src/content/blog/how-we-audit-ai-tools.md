---
title: How We Audit AI Tools: A Behind-the-Scenes Look
date: 2026-07-22
description: Inside the four-stage due diligence pipeline that every tool in Enclavetools passes through before it gets listed. From automated discovery to human-supervised verification.
author: Mamy Rakotomalala
---

Anyone can scan a GitHub repo for dependencies. But verifying that a tool actually does what its README claims — and nothing more — requires a different approach entirely.

Our pipeline starts with automated discovery. We mine GitHub Topics, HuggingFace Hub, and community sources for candidates. Each one gets a license scan via ScanCode and FOSSology before it's even looked at by a human.

Next comes static code review. A coding agent reads the full source tree: every dependency, every telemetry SDK, every outbound call pattern. The goal isn't to find perfection — it's to find red flags. Anything ambiguous gets tagged for human review.

Then we verify declared requirements: RAM, VRAM, OS support. We check commit activity and release cadence for maintenance health. These are the maintainer's numbers, not ours — but they tell you whether the project is still alive.

Finally, a human resolves the edge cases. Unknown licenses. Ambiguous network calls. Dependencies with known CVEs. Nothing goes live until a person signs off.

This is what due diligence looks like when you take privacy seriously.
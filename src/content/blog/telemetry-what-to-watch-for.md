---
title: "Telemetry in AI Tools: What to Watch For"
date: 2026-07-22
description: "The most common telemetry patterns we find in AI tools — and why they matter for your data privacy. A practical guide to identifying what's really happening under the hood."
author: "Mamy Rakotomalala"
---

Telemetry isn't always obvious. It's not always a phone-home call in the obvious places. Sometimes it's baked into a dependency you didn't scrutinize. Sometimes it's embedded in a model's default configuration.

The patterns we see most often include:

- Anonymous usage reporting packaged with analytics SDKs that weren't mentioned in the README
- Outbound calls to model providers during inference — even for "offline" tools
- Crash reporters that exfiltrate system information to third-party endpoints
- Update checkers that leak your installed version and hardware profile
- Background sync features that send usage metrics to a vendor's telemetry infrastructure

Each of these patterns was found and documented during our audits. Tools that ship any of them without explicit user consent don't make the directory.

The bottom line: if you can't verify what a tool sends out, you can't trust what it keeps private.
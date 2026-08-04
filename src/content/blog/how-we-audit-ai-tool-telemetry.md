---
title: "How We Audit Local AI Telemetry"
date: 2026-08-04
description: "Our methodology for auditing local AI tools using static analysis, dynamic network capture, and sandbox testing."
author: "Mamy Rakotomalala"
---

Our multi-stage security audit inspects binaries, monitors network traffic, and analyzes source code to verify zero-telemetry claims.

### WHY IT MATTERS
Vendor privacy statements often contradict actual background binary behavior during operation. A **rigorous technical audit guarantees true data privacy** for self-hosted AI deployments.

### GO DEEPER
- **Static code analysis:** Scan GitHub source code for embedded tracking libraries and telemetry SDKs.
- **Dynamic network capture:** Monitor Wireshark and eBPF network sockets during model inference.
- **Binary string extraction:** Inspect compiled binaries for hardcoded analytics URLs and tracking tokens.
- **Air-gap testing:** Run tools in isolated sandbox environments to identify broken dependencies.
- **Dependency verification:** Validate third-party libraries for hidden telemetry and license risks.
- **Automated scanning:** Run ScanCode and static analyzers across model execution frameworks.

### THE BOTTOM LINE
Empirical network and binary verification is the only reliable way to confirm vendor privacy claims.

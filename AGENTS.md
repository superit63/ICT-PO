# Agent Operating Guide

## Scope

This repository contains the `sale-stock-po-app` Next.js application. Read `README.md`, `sale-stock-po-app/package.json`, the nested `sale-stock-po-app/AGENTS.md`, and the affected source/tests before changing behavior.

## Safety

- Preserve unrelated dirty work and local environment/database files.
- Do not install dependencies, seed or mutate databases, start services, deploy, or use network commands during verification.
- Keep credentials in ignored environment files and never print or commit them.
- Governance rollout changes are limited to this file and `scripts/verify-fast`, `scripts/verify`, `scripts/verify-release`.

## Verification

- `scripts/verify-fast`: local ESLint gate.
- `scripts/verify`: lint plus bounded Vitest run.
- `scripts/verify-release`: lint, tests, and local ignored Next.js build.
- Every wrapper must return the underlying command's real exit code.

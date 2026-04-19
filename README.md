# PrivacyGuard

PrivacyGuard is now a lean filing-agent prototype for supported privacy request workflows.

## What is in this repo
- Static marketing site in `index.html`
- Minimal Node backend in `api/`
- Target registry in `api/data/targets.json`
- Queue and audit storage in `api/data/`
- Adapter layer in `api/lib/adapters.js`

## Current behavior
- Guided official flow for California DROP
- Manual broker request template flow
- Privacy email workflow
- Explicit unsupported fallback

## Product boundary
This version does not claim universal auto-submission. It only prepares and tracks supported workflows and keeps an audit log.

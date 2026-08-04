# Aetherling Agency Kernel v0.1

This package is the first verified AetherForge vertical slice.

## Proven path

```text
VerifiedObservation
→ Informatron
→ Chronos append-only ledger
→ mandatory action and non-action options
→ deterministic counterfactuals
→ Ethica capability and approval gate
→ sealed AgencyDecision
→ restricted atomic file action
→ TRACE-0 hash chain
→ expected-vs-actual outcome
→ immutable successor AetherlingState
→ deterministic WorldGraph rebuild
→ restart and ledger-tip verification
```

## Laws enforced

1. The current state is immutable.
2. Learning creates a successor state; history is never rewritten.
3. `ACT`, `DO NOTHING`, `DELAY`, `SEEK EVIDENCE`, and `REQUEST HUMAN DECISION` are always available.
4. Writable capabilities require scoped, unexpired human approval.
5. The executor is sandboxed and blocks path traversal.
6. Chronos and TRACE-0 are independent hash chains.
7. The World Graph is a deterministic projection, not a second source of truth.

## Run

From the repository root:

```bash
npm install
npm run test:agency-kernel
```

Or run the package directly:

```bash
cd packages/agency-kernel
npm install
npm test
```

The suite proves both the denied and approved paths and reconstructs the Chronos ledger after restart.

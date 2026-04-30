# Blinkpage AI Assistant — Eval Harness

Regression tests for the AI assistant. Each fixture is a real prompt against staging Spica's `/ai/chat` endpoint with `dry_run=true` so mutations don't persist. The runner asserts that the model's tool sequence is a *supersequence* of the expected sequence (extras allowed, gaps not), plus iteration and cost caps.

## Setup

```sh
yarn install
```

Required env vars:
- `SPICA_URL` — base URL of your staging Spica instance (e.g. `https://blinkpage-staging-bbc49.hq.spicaengine.com/api`)
- `SPICA_TOKEN` — identity token from a Spica login (admin role recommended; the eval snapshot endpoint is admin-gated)

Optional:
- `AI_EVAL_ONLY=<fixture-id>` — run a single fixture by id
- `AI_EVAL_OUT=results.json` — write a structured results report

## Seeding test projects

The fixtures reference three test projects by stable name:

```sh
yarn ai-evals:seed
```

After seeding, **update the `context.project_id` and `context.page_id` fields in `fixtures/*.json`** with the IDs printed by the seeder. (We can automate that lookup later — for now the fixtures use placeholder strings like `AI_EVAL_SAAS`.)

## Running

```sh
yarn ai-evals
```

Output looks like:

```
✓ regenerate-about-content (3214ms, 4 iter, $0.0021)
✗ build-saas-landing (8120ms, 5 iter, $0.0312)
    expected_pending_confirmation=generate_page_outline got=null
9/10 fixtures passed.
```

## CI

Wire `yarn ai-evals` into the CI workflow that touches the AI surface (`function/69bd00000000000000000007/**`, `landing-composer/src/prefabs/ai-assistant/**`, `landing-composer/src/services/AiTools.ts`). Caps are intentionally low ($0.03–$0.07 per fixture) so a full run stays under ~$0.50.

## Cost caps

Each fixture sets `max_cost_usd` and `max_iterations`. The runner fails the fixture if either is exceeded. The total monthly eval spend is bounded by `(fixture_count × max_cost_usd × runs_per_day × days)` — currently ~$5/month at one nightly run.

# Changelog

## [0.1.5](https://github.com/dwmkerr/livedown/compare/v0.1.4...v0.1.5) (2026-05-05)


### Features

* implement spec for [#52](https://github.com/dwmkerr/livedown/issues/52) show subagent/skill usage table in PR bodies ([#103](https://github.com/dwmkerr/livedown/issues/103)) ([d434469](https://github.com/dwmkerr/livedown/commit/d434469e7752b9e3c659359875570b1acf8099f6))
* **openspec-flow:** sub-agent delegation is opt-in via repo variable ([#93](https://github.com/dwmkerr/livedown/issues/93)) ([103e809](https://github.com/dwmkerr/livedown/commit/103e809429b3daa6c7b868afd4dedbb2d0f577aa))
* **openspec-flow:** support CLAUDE_CODE_OAUTH_TOKEN as alternative to API key ([#97](https://github.com/dwmkerr/livedown/issues/97)) ([8ae480b](https://github.com/dwmkerr/livedown/commit/8ae480bb6dfcacd8b1da31a93bf4e3b3d869b975))
* viewer + landing redesign (V2 Reader-primary) ([#111](https://github.com/dwmkerr/livedown/issues/111)) ([1f9c1e6](https://github.com/dwmkerr/livedown/commit/1f9c1e6705ca6e0a5a7d3abf6758d9fb9c742c48))


### Bug Fixes

* **action:** drop ${{ secrets.* }} from composite action input description ([#89](https://github.com/dwmkerr/livedown/issues/89)) ([620f5e2](https://github.com/dwmkerr/livedown/commit/620f5e253ef7644cd2b67913c0377eed6f882971))
* **cicd:** grant actions:write to dispatch-deploy job ([#74](https://github.com/dwmkerr/livedown/issues/74)) ([0edb94e](https://github.com/dwmkerr/livedown/commit/0edb94e12ecded9ae96340d09544e30c966fc408))
* **openspec-flow:** allow agent to edit .github/workflows via repo var ([#80](https://github.com/dwmkerr/livedown/issues/80)) ([f8357bc](https://github.com/dwmkerr/livedown/commit/f8357bc00ee6099be008981c7889849d3cc3b59d))
* **openspec-flow:** export ADDITIONAL_PERMISSIONS with correct env name ([#86](https://github.com/dwmkerr/livedown/issues/86)) ([be147f5](https://github.com/dwmkerr/livedown/commit/be147f5c2c13799770cb8868fa75377611357044))
* **run-agent:** OAuth token takes precedence; API key suppressed when set ([#100](https://github.com/dwmkerr/livedown/issues/100)) ([2054aa3](https://github.com/dwmkerr/livedown/commit/2054aa37c412062dc8b86bc1471229e18f2d84e5))
* **run-agent:** revert OAuth precedence; SDK API-key-wins is correct ([#102](https://github.com/dwmkerr/livedown/issues/102)) ([e24f28d](https://github.com/dwmkerr/livedown/commit/e24f28d20aaae30560cfaf328fc67529e4ecc0be))

## [0.1.4](https://github.com/dwmkerr/livedown/compare/v0.1.3...v0.1.4) (2026-04-21)


### Bug Fixes

* **ci:** split cicd + deploy, add partykit preflight and timeout ([#73](https://github.com/dwmkerr/livedown/issues/73)) ([bcdb4a1](https://github.com/dwmkerr/livedown/commit/bcdb4a19811109781050e53de57bddc527727038))
* **implement:** dedupe ignores closed-unmerged impl PRs ([#71](https://github.com/dwmkerr/livedown/issues/71)) ([240e76d](https://github.com/dwmkerr/livedown/commit/240e76d5ba475e8af7ea0323d6a43c25f4504009))
* **state-machine:** plan preflight + postflight + unmerged-close cleanup ([#69](https://github.com/dwmkerr/livedown/issues/69)) ([146c3ad](https://github.com/dwmkerr/livedown/commit/146c3ad7ffc145bf553ef6b92e3f237625092f66))

## [0.1.3](https://github.com/dwmkerr/livedown/compare/v0.1.2...v0.1.3) (2026-04-21)


### Features

* add openspec-flow workflow + scaffold ([#23](https://github.com/dwmkerr/livedown/issues/23)) ([bab6d45](https://github.com/dwmkerr/livedown/commit/bab6d451a2260a9250f81b39f7c3936d51ef7096))
* add openspec-flow-implement workflow (apply + verify + archive) ([#28](https://github.com/dwmkerr/livedown/issues/28)) ([113796c](https://github.com/dwmkerr/livedown/commit/113796c1d8217725b5bd794688f89eeef5dd5a1f))
* consolidate openspec flow + add respond job ([#34](https://github.com/dwmkerr/livedown/issues/34)) ([c1b2747](https://github.com/dwmkerr/livedown/commit/c1b2747aee8bfb9ed3bfa75bd57023341f994322))
* implement spec for [#2](https://github.com/dwmkerr/livedown/issues/2) docker instructions ([#44](https://github.com/dwmkerr/livedown/issues/44)) ([9113e61](https://github.com/dwmkerr/livedown/commit/9113e615dd4d4e1746a7112325ae15a1a7740414))
* implement spec for [#37](https://github.com/dwmkerr/livedown/issues/37) extract openspec-flow composite actions ([#42](https://github.com/dwmkerr/livedown/issues/42)) ([0a1e8af](https://github.com/dwmkerr/livedown/commit/0a1e8af12110d5c5b39b41de0aaaf9e7b24beb9a))
* implement spec for [#48](https://github.com/dwmkerr/livedown/issues/48) preflight checks + postflight assertions ([#61](https://github.com/dwmkerr/livedown/issues/61)) ([e39a549](https://github.com/dwmkerr/livedown/commit/e39a5492d417afd80e36b32abfaa980d1558ba14))
* **implement:** drop breadcrumb comments on the merged spec PR ([#59](https://github.com/dwmkerr/livedown/issues/59)) ([6c6981f](https://github.com/dwmkerr/livedown/commit/6c6981f3c8087d8f03ceda0f6e13e6d381aa2d02))
* issue label drives implement; nudge when impl PR exists ([#43](https://github.com/dwmkerr/livedown/issues/43)) ([86a01cf](https://github.com/dwmkerr/livedown/commit/86a01cf229a3182fe74c667123a41d2118603e44))


### Bug Fixes

* clean up CLI clipboard flow and add tab completion ([#12](https://github.com/dwmkerr/livedown/issues/12)) ([9eda3a9](https://github.com/dwmkerr/livedown/commit/9eda3a9f9a47d9e80260889a3c3917181ae9dda5))
* impl PR closes linked issue + cleanup job clears review label ([#49](https://github.com/dwmkerr/livedown/issues/49)) ([a37bbff](https://github.com/dwmkerr/livedown/commit/a37bbff27ba60bd20f267673ab3f24d98ede5ce6))
* **implement:** postflight assert impl PR exists — catch silent no-op ([#60](https://github.com/dwmkerr/livedown/issues/60)) ([7bbb4d0](https://github.com/dwmkerr/livedown/commit/7bbb4d0aae2020fc07d14e4cf8669c37e4aec9a4))
* inline prune-agent-comments logic; remove helper script ([#36](https://github.com/dwmkerr/livedown/issues/36)) ([4e80262](https://github.com/dwmkerr/livedown/commit/4e802624a54b5ffbc76571adfff94ac03f05083e))
* pipe gh api output to jq so --arg reaches jq ([#40](https://github.com/dwmkerr/livedown/issues/40)) ([6fda1f4](https://github.com/dwmkerr/livedown/commit/6fda1f40decfc0ca7fe44a5f179e1b2ee4776b6f))
* **plan:** require grounded research — clone external repos + read docs ([#56](https://github.com/dwmkerr/livedown/issues/56)) ([340d46f](https://github.com/dwmkerr/livedown/commit/340d46f17866bab7cfbad49d953652f6df257c81))
* start watcher before clipboard prompt, add security-mistakes.md ([012c6d5](https://github.com/dwmkerr/livedown/commit/012c6d53492f24bcba864ecb03b8a5590609608a))

## [0.1.2](https://github.com/dwmkerr/livedown/compare/v0.1.1...v0.1.2) (2026-03-25)


### Features

* add edit key write protection with Ed25519 signing ([758a2bf](https://github.com/dwmkerr/livedown/commit/758a2bfd7391391e06d92902aaad8949ae6718ec))
* add security audit agent and agent-actions workflow ([#7](https://github.com/dwmkerr/livedown/issues/7)) ([452b429](https://github.com/dwmkerr/livedown/commit/452b4293269357579bf1c8252197b438ae275857))

## [0.1.1](https://github.com/dwmkerr/livedown/compare/v0.1.0...v0.1.1) (2026-03-24)


### Features

* scaffold livedown CLI with PartyKit relay ([#1](https://github.com/dwmkerr/livedown/issues/1)) ([4fb74f3](https://github.com/dwmkerr/livedown/commit/4fb74f39cff07482de0e5062e7d9a86fd709f56c))


### Bug Fixes

* use patch bumps for feat commits while pre-1.0 ([#4](https://github.com/dwmkerr/livedown/issues/4)) ([3f05363](https://github.com/dwmkerr/livedown/commit/3f05363ee23ffd4b1056e8a16012a900a6ccabf8))

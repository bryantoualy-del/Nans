# Nans V3 — Volto protected surface

Baseline: `356eae5` (`main`, before this migration). The original Volto CSS remains in the inline stylesheet of `index.html`. Its functional state remains in `S` under `mode`, `hits`, `stored`, `weaponMagic`, `energyUsedTurn`, `pending` and `eco` and is persisted with the original `nans-combat-state-v1` key.

Protected DOM: `modeSwitch`, `swordView`, `axeView`, `axeCard`, `chargeLabel`, `meter`, `energyText`, `axeEnergyText`, `impactBtn`, `attackBtn`, and the shared `fx` layer.

Protected logic: `makeBolt`, `scatterSparks`, `syncVoltoFx`, `fxTransfer`, `fxLightningHit`, `fxChargedImpact`, `toggleWeaponMode`, `transferEnergy`, `clearVolto`, `beginAttack`, `damageRoll`, `confirmHit`, `chargedImpact`, and the Volto section of `render`. The V3 layout wraps these nodes in the Attaques pane without cloning them. Existing yellow/red effects keep priority; new Nans effects use separate `nans-fx` classes and a lower z-index.

Protected visual selectors: `body.volto-yellow`, `body.volto-red`, `voltoYellowPulse`, `voltoRedPulse`, `chargeOrbit`, `impactReadyYellow`, `impactReadyRed`, `.fx-bolt`, `.fx-bolt.red`, `.fx-spark`, `.fx-spark.red`, `.fx-impact-flash`, `.fx-impact-flash.red`, `.fx-impact-wave`, `.fx-proc-flash`, `.fx-proc-ring`, `voltoProcKick`, and `voltoProcShake`.

Audit: the original page exposed four combat navigation tabs, a top row of repeated resources, a small journal, and the already existing V3 Social, Inventory and Notes module. Combat shell and defenses were reorganized; Volto mode and charge state were not migrated into a new store. The `tests/volto-regression.cjs` scenario covers miss, yellow/red thresholds, transfer, impact, purge, repeated switches, and saved state, alongside other mechanical checks. Run with `node tests/volto-regression.cjs`.

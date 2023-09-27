#!/bin/bash

rollup -c --configPlugin typescript
rollup -c rollup.worker.config.ts --configPlugin typescript
rollup -c rollup.export.config.ts --configPlugin typescript
rollup -c rollup.dts.config.ts --configPlugin typescript

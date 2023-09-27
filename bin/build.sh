#!/bin/bash

rollup -c --configPlugin typescript
rollup -c rollup.worker.config.ts --configPlugin typescript
rollup -c rollup.export.config.ts --configPlugin typescript
rollup -c rollup.dts.config.ts --configPlugin typescript

rm -rf build
mkdir -p build
cp dist/HaloBot* build/
cp dist/worker.min.mjs build/

# Contributing

Good contributions explain a real design decision or show a real result. Include the original mark, the intended character translation, the prompt, and what changed after inspecting the output. Use only artwork and marks you have permission to share.

For a bug, describe the agent and image tool, expected output, actual output, and a minimal way to reproduce it. The skill cannot guarantee a generator's exact style or character consistency.

Before a pull request, run `python3 scripts/validate.py`. For gallery changes, also open `docs/` in a real browser and check a narrow viewport, the brand tabs, and the story picker. Keep example records and image paths together.

The gallery runs with `python3 -m http.server 4173 --directory docs`. It needs no build step or site dependencies.

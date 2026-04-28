# Pack Authoring

Project packs are optional overlays for project-specific workflows. Bobkit core must remain project-neutral.

## Pack Rules

- Add project-specific skills under the pack, not in core.
- Override core behavior only when the project genuinely requires it.
- Include verification expectations with every workflow change.
- Keep pack metadata in a `pack.yaml` file for humans until pack compilation is implemented.

The future Plukplan pack should live at `packs/plukplan`.

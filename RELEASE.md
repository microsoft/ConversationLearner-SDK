# Release Process

This document outlines the process a developer would take to release a new version of blis-sdk.

## Dependency Tree

In normal applications UI is generally the top level dependency the user interacts with; however, in this case blis-ui is an actual npm package of the blis-sdk.  This allows the SDK to provide every thing the developer needs to get started.

```
  blis-sdk-sample
      |
  blis-sdk
      |    \
      |  blis-ui
      |    /
  blis-models
```

> Notice blis-models is consumed by both the SDK and UI

# Self-contained changes
If the code changes to blis-sdk do not require changes in blis-ui or blis-models then no special action is needed. Simply submit a PR and the merge will automatically publish a new version. Then update blis-sdk-sample to consume this new version.

# Cross-repo changes
In this case the code changes would require updates to blis-models and/or blis-ui.
In order to the changes without having to publish packages it is recommended to use [`npm link`](https://docs.npmjs.com/cli/link). This essentially points the dependency to another location on disk instead of an actual package which means you gets live updates as dependencies are re-built.

1. Get `link` chain setup, make necessary code changes across all repos, and test.

    (Since all the code changes are complete and tested the only thing left to do is use the actual npm packages instead of the locally linked versions)

2. Submit PR for changes in `blis-models`

3. Merge PR to auto-publish new version of `blis-models` based on changes.

4. Uptake new version of `blis-models` in `blis-ui` and `blis-sdk`

5. Submit PR for changes in `blis-ui`

6. Merge PR to auto-publish new version of `blis-ui` based on changes.

   (Currently this auto-publish does not analayze commits and will always increment minor version)

7. Update new version of `blis-ui` in `blis-sdk`

8. Submit PR for changes in `blis-sdk`

9. Merge PR to auto-publish new version of `blis-sdk` based on changes.

10. Update new version of `blis-sdk` in `blis-sdk-sample`

11. Submit PR for changes in `blis-sdk-sample`

12. Merge PR 

    (blis-sdk-sample is not an npm package; no publishing is required)




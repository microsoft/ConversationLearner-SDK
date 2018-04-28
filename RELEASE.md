# Release Process

This document outlines the process a developer would take to release a new version of converstionlearner-sdk.

## Dependency Tree

In normal applications UI is generally the top level dependency the user interacts with; however, in this case converstionlearner-ui is an actual npm package of the converstionlearner-sdk.  This allows the SDK to provide every thing the developer needs to get started.

```
  converstionlearner-sdk-sample
      |
  converstionlearner-sdk
      |    \
      |  converstionlearner-ui
      |    /
  converstionlearner-models
```

> Notice converstionlearner-models is consumed by both the SDK and UI

# Self-contained changes
If the code changes to converstionlearner-sdk do not require changes in converstionlearner-ui or converstionlearner-models then no special action is needed. Simply submit a PR and the merge will automatically publish a new version. Then update converstionlearner-sdk-sample to consume this new version.

# Cross-repo changes
In this case the code changes would require updates to converstionlearner-models and/or converstionlearner-ui.
In order to the changes without having to publish packages it is recommended to use [`npm link`](https://docs.npmjs.com/cli/link). This essentially points the dependency to another location on disk instead of an actual package which means you gets live updates as dependencies are re-built.

1. Get `link` chain setup, make necessary code changes across all repos, and test.

    (Since all the code changes are complete and tested the only thing left to do is use the actual npm packages instead of the locally linked versions)

2. Submit PR for changes in `converstionlearner-models`
  
    > Note: When committing changes you should use the `npm run commit` command which will output a conventional commit message. This message is analyzed by the build to know which version to increment.

3. Merge PR to auto-publish new version of `converstionlearner-models` based on changes.

4. Uptake new version of `converstionlearner-models` in `converstionlearner-ui` and `converstionlearner-sdk`

5. Submit PR for changes in `converstionlearner-ui`

6. Merge PR to auto-publish new version of `converstionlearner-ui` based on changes.

   (Currently this auto-publish does not analayze commits and will always increment minor version)

7. Update new version of `converstionlearner-ui` in `converstionlearner-sdk`

8. Submit PR for changes in `converstionlearner-sdk`

9. Merge PR to auto-publish new version of `converstionlearner-sdk` based on changes.
  
   (Currently this auto-publish does not analayze commits and will always increment minor version)

10. Update new version of `converstionlearner-sdk` in `converstionlearner-sdk-sample`

11. Submit PR for changes in `converstionlearner-sdk-sample`

12. Merge PR 

    (converstionlearner-sdk-sample is not an npm package; no publishing is required)

# Promoting packages to latest

`converstionlearner-sdk` is the only package we expect consumers to use and by default it is published to the `next` tag to allow publishing releases of newere possibly breaking features without risking / distrupting current user workflow.

After it's determined that the particular version of the package is stable it can be promoted to the `latest` tag to become the default package installed by users.

To promote a package to latest tag:
```bash
npm dist-tag add converstionlearner-sdk@0.126.0 latest
```

To view tags for a particular pacakge:
```bash
npm view converstionlearner-sdk dist-tags
```

To view all published versions:
```bash
npm view converstionlearner-sdk versions
```




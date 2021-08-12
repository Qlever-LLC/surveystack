#!/bin/bash

# run these commands one for yarn to set up version tags


yarn config set version-tag-prefix "v"
yarn config set version-git-message "v%s"
yarn config set version-git-tag true
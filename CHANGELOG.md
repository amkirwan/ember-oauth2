# Changelog Ember-OAuth2

## v0.4.0
  - Isolates function for opening window so that it can be overridden
  - Login dialog window returns a promise, it resolves on success and reject on error
## v0.3.2
  - Remove files not needed in package.
  - Add build files to dist dir for package manaagers. 
## v0.3.1
  - Initial relase to Bower
## v0.3.0
  - Added YUIDoc to src.
  - Published to NPM.
  - Using get and set for properties on the instances.
## v0.2.4
  - Change to using Ember.Evented class for handling 'redirct', 'success' and 'error' callback.
  - Depricated old callback methods.
## v0.2.3
  - Using grunt-versioner for updating and building project
  - Fixed incorrect path to jQuery when build from source
## v0.2.2 (Jan 11, 2014)
  - [a132c65](https://github.com/amkirwan/ember-oauth2/commit/a132c657ae0a5173fc78ab192c6db11e4074232c) updated patch version to v0.2.2
  - [ffd5069](https://github.com/amkirwan/ember-oauth2/commit/ffd50691721e96091e3642c1ecc871d66c2f48f8) grunt-bump commit changes
  - [a051d44](https://github.com/amkirwan/ember-oauth2/commit/a051d44a15c3e27fbcafe07e5fee43695e4fd68c) config bump, added custom task to update readme version
  - [aabf4e0](https://github.com/amkirwan/ember-oauth2/commit/aabf4e055d1cec84a904033fdb4889283544f32d) added grunt bump
  
## v0.2.1 (Jan 9, 2014)
  - [b925f2e](https://github.com/amkirwan/ember-oauth2/commit/b925f2ea303930785227c424ecba5f7c772275a8) version bump to v0.2.1 added dist dir for bower and node
  - [0d5e7ed](https://github.com/amkirwan/ember-oauth2/commit/0d5e7eddfe5483853476def213caa999354a09dc) do not ignore dist dir
  - [ea17257](https://github.com/amkirwan/ember-oauth2/commit/ea172578b6dbb6ab13b22583de3368fd7a5aae95) moved ember to dependencies
  - [7d5e752](https://github.com/amkirwan/ember-oauth2/commit/7d5e75227aa304c77385f24ff4e66408c58d1498) Update README.md

## v0.2.0 (Jan 9, 2014)
  - [9769bf1](https://github.com/amkirwan/ember-oauth2/commit/9769bf1daae3c9035b03a27b7ceabda4e53b6874) version bump v0.2.0
  - [1305ae8](https://github.com/amkirwan/ember-oauth2/commit/1305ae8504eff1961e4c09d10611e9ce2dbdf4a2) updated Gruntfile to new directory layout structure
  - [c00930f](https://github.com/amkirwan/ember-oauth2/commit/c00930f58ed8e384071320a04b1fb87091b1a041) moved lib and spec to src
  - [114d85d](https://github.com/amkirwan/ember-oauth2/commit/114d85d729bb28056d624b2df94cc88013ec3973) renamed packages dir to src

## v.0.1.0 (Jan 7, 2014)
  - [8914512](https://github.com/amkirwan/ember-oauth2/commit/8914512d4cffb9c0de8f1a2455948569846d291a) version bump
  - [a3cb3e2](https://github.com/amkirwan/ember-oauth2/commit/a3cb3e289a9fda3930e6f90c103aa010af41a1c0) fixed jshint warnings
  - [b2c4aea](https://github.com/amkirwan/ember-oauth2/commit/b2c4aea31e4f80153d7a7217a50fd1a1caf244ee) added missing var
  - [f1befdf](https://github.com/amkirwan/ember-oauth2/commit/f1befdfb5040c757090e48826bbf0c936dc34b5c) removed dist directory
  - [ba25b1e](https://github.com/amkirwan/ember-oauth2/commit/ba25b1e79f9eae2d3e992633189821392987bf7b) remove dist js files
  - [8de0dc3](https://github.com/amkirwan/ember-oauth2/commit/8de0dc3f6cb2d93a0a16752e9306b18e998a906b) adjusted readme.md
  - [c4e5829](https://github.com/amkirwan/ember-oauth2/commit/c4e58292a43190fd6e9b7af7d1b3bde900e7776f) travis should run tests using grunt task
  - [17eb7f7](https://github.com/amkirwan/ember-oauth2/commit/17eb7f71a275c94b3053d334f77004fbf6ef03b4) fixed ember-oauth2.png image

default: help

# Forward bare goals into ARGS so `make start -- <cli args>` works alongside
# `make start ARGS="…"`.
ARGS ?= $(filter-out $@,$(MAKECMDGOALS))

.PHONY: help
help: # Show help for each of the Makefile recipes.
	@grep -E '^[a-zA-Z0-9 -]+:.*#'  Makefile | sort | while read -r l; do printf "\033[1;32m$$(echo $$l | cut -f 1 -d':')\033[00m:$$(echo $$l | cut -f 2- -d'#')\n"; done

.PHONY: install
install: # Install deps, build, and link the `livedown` CLI globally.
	npm install
	npm run build
	npm link

.PHONY: dev
dev: # Run the partykit dev server on localhost:1999 (serves landing + viewer; pair with `make start -- --dev share ./file.md`).
	npx partykit dev --port 1999

.PHONY: start
start: # Run the livedown CLI. Format `make start -- <cli args>`, e.g. `make start -- --dev share ./README.md`. ARGS=… also works.
	npm start -- $(ARGS)

.PHONY: test
test: # Run all tests (unit + integration).
	npm run test:all

# Swallow extra goals so they can be forwarded to `start` via ARGS without
# make complaining about unknown targets. Must stay last.
%:
	@:

.PHONY: zip

# Get the current git branch and determine the gnomeversion
gnomeversion := $(shell git rev-parse --abbrev-ref HEAD)

ifeq ($(gnomeversion), main)
	gnomeversion := 45-46
endif

ifeq ($(gnomeversion), gnome44_and_older)
	gnomeversion := 44-and-older
endif

# Default to empty if no V is provided
V ?= $(word 2, $(MAKECMDGOALS))

# Ensure the version number is provided
ifeq ($(V),)
	$(error Please provide the version number, e.g. make zip V=12)
endif

# Zip target
zip:
	# Ensure the zip directory exists
	mkdir -p zip

	# Remove old zip file if it exists
	rm -f zip/fix-focus-on-workspace-switch-v$(V)-gnome$(gnomeversion).zip

	# Create the zip file
	zip -r zip/fix-focus-on-workspace-switch-v$(V)-gnome$(gnomeversion).zip extension.js LICENSE metadata.json README.md

	# Output the result
	echo "Created zip/fix-focus-on-workspace-switch-v$(V)-gnome$(gnomeversion).zip with the following files: extension.js LICENSE metadata.json README.md"

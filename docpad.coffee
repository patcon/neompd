# DocPad Configuration File
# http://docpad.org/docs/config

# Define the DocPad Configuration
docpadConfig = {
	# ...

	collections:
		posts: ->
			@getCollection("html").findAllLive({relativeOutDirPath:'posts'})
		tags: ->
			@getCollection("documents").findAllLive({relativeOutDirPath:'tags'})

	skipUnsupportedPlugins: false

	enabledPlugins:
		eco: true
		marked: true
		less: true

  plugins:
    eco: {}
    less: {}
    marked: {}
    sunny:
      configFromEnv: true
      envPrefixes: [
        "DOCPAD_SUNNY_"
      ]
}
# Export the DocPad Configuration
module.exports = docpadConfig

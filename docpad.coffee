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

	enabledPlugins:
		eco: true
		marked: true
		less: true

	plugins:
		eco: {}
		marked: {}
		less: {}
}
# Export the DocPad Configuration
module.exports = docpadConfig

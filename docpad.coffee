# DocPad Configuration File
# http://docpad.org/docs/config

# Define the DocPad Configuration
docpadConfig = {
	# ...

	collections:
		posts: ->
			@getCollection("html").findAllLive({relativeOutDirPath:'posts'})
}
# Export the DocPad Configuration
module.exports = docpadConfig

# DocPad Configuration File
# http://docpad.org/docs/config

# Define the DocPad Configuration
docpadConfig = {
	# ...

	templateData:
		# Helper Function
		buildTitle: (header) ->
			'<span>' + header.split(/\n/).join('</span><span>') + '</span>'

	collections:
		posts: ->
			@getCollection("html").findAllLive({relativeOutDirPath:'posts'})
}
# Export the DocPad Configuration
module.exports = docpadConfig

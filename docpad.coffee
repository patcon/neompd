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
		sunny: true

	plugins:
		eco: {}
		less: {}
		marked: {}
		sunny:
			cloudConfigs: [
				acl: "public-read"
				container: process.env.DOCPAD_SUNNY_CONTAINER
				sunny:
					provider: "aws"
					retryLimit: -1
					authUrl: "s3-#{process.env.DOCPAD_SUNNY_CONTAINER_REGION}.amazonaws.com"
					account: process.env.DOCPAD_SUNNY_ACCOUNT
					secretKey: process.env.DOCPAD_SUNNY_SECRETKEY
			]
}
# Export the DocPad Configuration
module.exports = docpadConfig

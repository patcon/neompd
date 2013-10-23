# DocPad Configuration File
# http://docpad.org/docs/config

#import
#moment = require('moment')

# Define the DocPad Configuration
docpadConfig = {
	# ...
	templateData:
		#postDate: (date, format="MMMM DD, YYYY") -> return moment(date).format(format)

    collections:
    	posts: ->
    		@getCollection("html").findAllLive({relativeOutDirPath:'posts'})
}
# Export the DocPad Configuration
module.exports = docpadConfig

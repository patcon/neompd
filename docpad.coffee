# DocPad Configuration File
# http://docpad.org/docs/config

# Define the DocPad Configuration
docpadConfig = {
	# ...

	templateData:

		# Helper Function
		buildTitle: (header) ->
			arr = header.split(/\s+\b/)
			result = "<span>"
			count = 0
			for i of arr
				count++
				result += arr[i] + " "
				result += "</span><span>"  if not (count % 3) and count isnt arr.length
			result += "</span>"
			result

	collections:
		posts: ->
			@getCollection("html").findAllLive({relativeOutDirPath:'posts'})
}
# Export the DocPad Configuration
module.exports = docpadConfig

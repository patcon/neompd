# Export Grunt configruation
module.exports = (grunt) ->

  grunt.initConfig
    # Minify CSS
    cssmin:
      index:
        files:
          # Replace the CSS with a minified copy of it.
          'out/styles/main.css': [
            'out/styles/main.css'
          ]

  # Load all available tasks.
  grunt.loadNpmTasks "grunt-contrib-cssmin"

  # On the production environment, minify the CSS.
  grunt.registerTask "production", ["cssmin"]

  # On the development environment, register no tasks.
  grunt.registerTask "development", []

  # By default, run the development tasks.
  grunt.registerTask "default", ["development"]

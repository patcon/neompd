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

    # Use Webpack to bundle all the JavaScript together correctly.
    webpack:
      compile:
        context: "out/scripts"
        entry: "./entry.js"
        output:
          path: "out/scripts/"
          filename: "main.js"
        stats:
          colors: true
          reasons: true
        failOnError: true
        optimize:
          minimize: false

  # Load all available tasks.
  grunt.loadNpmTasks "grunt-contrib-cssmin"
  grunt.loadNpmTasks "grunt-webpack"

  # On the production environment, run Webpack and the CSS minifier.
  grunt.registerTask "production", ["webpack", "cssmin"]

  # On the development environment, just run Webpack.
  grunt.registerTask "development", ["webpack"]

  # By default, run the Development tasks.
  grunt.registerTask "default", ["development"]

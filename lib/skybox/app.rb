require 'sinatra/base'

class Skybox
  # The Skybox App class represents the Sinatra that can be run.
  class App < Sinatra::Base
    ############################################################################
    #
    # Configuration
    #
    ############################################################################

    configure do
      enable :logging
      set :paths, [
        Dir.pwd,
        Dir.home,
        File.join(File.expand_path(File.dirname(__FILE__)), 'public')
        ]
    end
    

    ############################################################################
    #
    # Attributes
    #
    ############################################################################

    # A list of paths that Skybox searches through to find pages to render.
    # By default this list will search within the present working directory
    # first, then the ~/.skybox directory and then finally it will look within
    # the gem.
    attr_accessor :paths
    

    ############################################################################
    #
    # Routes
    #
    ############################################################################

    # The default route attempts to load the html page located within the
    # list of paths configured on the application.
    get '/:name' do
      settings.paths.each do |path|
        filename = "#{path}/#{params[:name]}.html"
        next unless File.exists?(filename)

        # Render the page.
        return send_file filename
      end
      
      # If it's not found then show a 404.
      #status 404
      return 'Not found'
    end
  end
end
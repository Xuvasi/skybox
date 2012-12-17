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
      enable :static
      set :public_folder, File.dirname(__FILE__) + '/static'
    end

    ############################################################################
    #
    # Routes
    #
    ############################################################################

    # Renders the home page.
    get '/' do
      erb :index
    end

    # Renders a built-in view.
    get '/:name' do
      erb params[:name]
    end
  end
end
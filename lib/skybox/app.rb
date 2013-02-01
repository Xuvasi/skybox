require 'sinatra/base'
require 'json'
require 'unindentable'

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

    ####################################
    # System-level
    ####################################

    # Retrieves a list of all actions.
    get '/tables' do
      @tables = SkyDB.get_tables()
      content_type 'application/json'
      JSON.dump(@tables)
    end

    # Retrieves a list of all actions.
    get '/actions' do
      @actions = SkyDB.get_actions()
      content_type 'application/json'
      JSON.dump(@actions)
    end

    # Retrieves a list of all properties.
    get '/properties' do
      @properties = SkyDB.get_properties()
      content_type 'application/json'
      JSON.dump(@properties)
    end


    ####################################
    # Analytics
    ####################################

    # Converts a JSON document to a Sky query, executes it and returns the
    # results.
    post '/query' do
      params = JSON.parse(request.env["rack.input"].read)
      
      # Set the table name.
      SkyDB.table_name = params['table']
      
      # Parse the query and return an error if it doesn't parse correctly.
      query = SkyDB.query.from_hash(params['query'])
      halt 422, params.inspect if query.nil?

      # Convert the result to JSON and return it.
      content_type :json
      results = query.execute
      return "#{results.to_json}\n"
    end

    # Generates the Lua code used by a given query.
    post '/query/code' do
      params = JSON.parse(request.env["rack.input"].read)
      
      # Parse the query and return an error if it doesn't parse correctly.
      query = SkyDB.query.from_hash(params['query'])
      halt 422 if query.nil?

      # Convert the result to JSON and return it.
      content_type :text
      return "#{query.codegen()}\n"
    end



    ####################################
    # Views
    ####################################

    # Renders the home page.
    get '/' do
      erb :index
    end

    # Renders a built-in view.
    get '/:name' do
      erb params[:name].to_sym
    end
  end
end
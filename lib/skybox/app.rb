require 'sinatra/base'
require 'json'
require 'unindentable'

class Skybox
  # The Skybox App class represents the Sinatra app that can be run.
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
    # API
    ####################################

    # Retrieves a list of all properties on a table.
    get '/api/:table_name/properties' do
      table = SkyDB::Table.new(:name => params[:table_name], :client => settings.client)
      properties = table.get_properties()
      content_type :json
      return "#{properties.to_json}\n"
    end

    # Executes a query for a given table on the Sky server.
    post '/api/:table_name/query' do
      # Read the query from the POST body.
      q = JSON.parse(request.env["rack.input"].read, :max_nesting => 200)
      halt 422 if q.nil?

      # Execute the query on the Sky server and return the results.
      warn(params)
      results = settings.client.query(SkyDB::Table.new(:name => params[:table_name]), q)
      content_type :json
      return "#{results.to_json}\n"
    end


    ####################################
    # Views
    ####################################

    get '/' do
      @tables = settings.client.get_tables()
      erb :index
    end

    get '/:table_name' do
      redirect "/#{params[:table_name]}/explore"
    end

    get '/:table_name/explore' do
      @table_name = params[:table_name]
      erb :explore
    end
  end
end
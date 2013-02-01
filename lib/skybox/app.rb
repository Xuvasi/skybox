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
    get '/query' do
      action_id = params[:actionId].to_i

      result = SkyDB.aggregate(
        <<-BLOCK.unindent
          function aggregate(cursor, data)
            if data.actions == nil then data.actions = {} end
            last_action_timestamps = {}
            event = cursor:event()
          
            -- Loop over each event in the path.
            while cursor:next() do
              if data.actions[event.action_id] == nil then
                data.actions[event.action_id] = {total_count=0, count=0, time=0}
              end

              -- Loop over each last action to determine the time it occurred.
              if event.action_id == #{action_id} then
                for k,v in ipairs(last_action_timestamps) do
                  data.actions[k].count = data.actions[k].count + 1
                  data.actions[k].time = data.actions[k].time + (event.timestamp - data.actions[k].time)
                end
              end
              
              -- Save the last occurrance of this action.
              last_action_timestamps[event.action_id] = event.timestamp
              data.actions[event.action_id].total_count = data.actions[event.action_id].total_count + 1
            end
          end
        BLOCK
      )
  
      # Convert the result to JSON and return it.
      content_type :json
      return result.to_json
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
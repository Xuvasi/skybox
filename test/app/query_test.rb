require 'test_helper'

class TestAppQuery < MiniTest::Unit::TestCase
  include Rack::Test::Methods

  def app
    Sinatra::Application
  end


  ######################################
  # Query
  ######################################

  def test_query_count
    post '/query', IO.read("fixtures/app/query/count.req.json"), "CONTENT_TYPE" => 'application/json'
    assert_equal IO.read("fixtures/app/query/count.resp.json"), last_response.body
  end
end

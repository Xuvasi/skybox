Skybox
======

_(This project is currently in alpha)_

### Overview

Skybox is an analytics front-end for the [Sky database](https://github.com/skydb/sky).
It's built to allow someone to dynamically drill through and slice behavioral data in real-time.
Skybox is also built to be extensible so you can extend the functionality of the server with simple Ruby.


### Install

To install Skybox, simply install the gem and run the server:

    $ gem install skybox
    $ skybox server

Skybox assumes you're running Sky locally.
To point to a different server simply use the `--sky=[HOST]:[PORT]` argument:

    $ skybox --sky 10.0.1.1             # Assumes default port 8585
    $ skybox --sky 10.0.1.1:5000

You can also specify the port you'd like Skybox to run on by using the `--port` or `-p` argument:

    $ skybox -p 8080

Once Skybox is running, it will tell you where to open your browser so you can view the application.


### Extending

Skybox is a Sinatra-based application and is built to be extended.
To add additional functionality, simply subclass the `Skybox::App`:

    class MyApp < Skybox::App
      get '/my_page' do
        ...
      end
    end

You'll need to override the `site.yml` which contains the navigation structure for the site.
You can run `skybox generate site` in your project to write a default `site.yml` file to your project.


### Testing

You can use cURL to test queries against the server like this:

```sh
curl -H "Content-Type: application/json" -X POST -d '{"table":"gharchive","query":{"selections":[{"fields":[{"aggregationType":"count"}]}]}}' http://localhost:10000/query
```

Or you can see the generated code from a query by using the `/query/code` endpoint:

```sh
curl -H "Content-Type: application/json" -X POST -d '{"table":"gharchive","query":{"selections":[{"fields":[{"aggregationType":"count"}]}]}}' http://localhost:10000/query/code
```


### Contributing

Have a cool feature you want to see added?
A bug that needs fixing?
Want to keep up to date on what's happening with Skybox?
Send an e-mail to the Sky mailing list: [sky@librelist.com](mailto:sky@librelist.com)!
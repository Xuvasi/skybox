# -*- encoding: utf-8 -*-

lib = File.expand_path('../lib/', __FILE__)
$:.unshift lib unless $:.include?(lib)

require 'skybox/version'

Gem::Specification.new do |s|
  s.name        = 'skybox'
  s.version     = Skybox::VERSION
  s.platform    = Gem::Platform::RUBY
  s.authors     = ['Ben Johnson']
  s.email       = ['benbjohnson@yahoo.com']
  s.homepage    = 'http://github.com/skydb/skybox.rb'
  s.summary     = 'Sky-based Analytics Frontend'

  s.add_dependency('sinatra', '~> 1.3.3')
  s.add_dependency('commander', '~> 4.1.2')

  s.add_development_dependency('rake', '~> 10.0.3')
  s.add_development_dependency('minitest', '~> 4.3.3')
  s.add_development_dependency('mocha', '~> 0.13.1')

  s.test_files   = Dir.glob('spec/**/*')
  s.files        = Dir.glob('lib/**/*') + %w(README.md CHANGELOG)
  s.require_path = 'lib'
end

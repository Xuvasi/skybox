require 'rubygems/package_task'

$:.unshift File.join(File.dirname(__FILE__), 'lib')
require 'skydb/version'


################################################################################
#
# Utility Tasks
#
################################################################################

task :console do
  sh "irb -I lib -r skybox"
end

task :rerun do
  sh "rerun --clear --pattern '**/*.{rb,erb}' -- bundle exec bin/skybox server --trace"
end


#############################################################################
#
# Packaging tasks
#
#############################################################################

task :release do
  puts ""
  print "Are you sure you want to relase Skybox #{Skybox::VERSION}? [y/N] "
  exit unless STDIN.gets.index(/y/i) == 0
  
  unless `git branch` =~ /^\* master$/
    puts "You must be on the master branch to release!"
    exit!
  end
  
  # Build gem and upload
  sh "gem build skybox.gemspec"
  sh "gem push skybox-#{Skybox::VERSION}.gem"
  sh "rm skybox-#{Skybox::VERSION}.gem"
  
  # Commit
  sh "git commit --allow-empty -a -m 'v#{Skybox::VERSION}'"
  sh "git tag v#{Skybox::VERSION}"
  sh "git push origin master"
  sh "git push origin v#{Skybox::VERSION}"
end

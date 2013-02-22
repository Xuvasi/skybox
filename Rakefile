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

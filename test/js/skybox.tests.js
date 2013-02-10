module("skybox.query.html")
test("SELECT count() GROUP BY action_id ON :enter", function() {
  var html = skybox.query.html({
    selections:[{
      fields: [{aggregationType:"count"}],
      groups: [{expression:"action_id"}],
      conditions: [{type:"on", action:"enter"}]
    }]
  })
  equal(html, 'Find the <span rel="popover" class="selection">number of actions performed</span> <span class="condition" data-condition-index="0">on session start</span>.')
});

test("SELECT count() GROUP BY action_id ON :enter AFTER <action>", function() {
  skybox.actions([{id:10, name:"/foo"}]);
  
  var html = skybox.query.html({
    selections:[{
      fields: [{aggregationType:"count"}],
      groups: [{expression:"action_id"}],
      conditions: [
        {type:"on", action:"enter"},
        {type:"after", action:{id:10}}
      ]
    }]
  })
  equal(html,
    'Find the <span rel="popover" class="selection">number of actions performed</span> ' +
    '<span class="condition" data-condition-index="0">on session start</span> ' +
    'and <span class="condition" data-condition-index="1">after <em>\'/foo\'</em></span>.'
  )
});

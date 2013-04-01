module("skybox.explore.normalize")
test("Normalize funnel analysis", function() {
  var query = {
    sessionIdleTime:7200,
    steps: [
      {type:"selection",name:"0",dimensions:["action"],fields:[{name:"count", expression:"count()"}]},
      {type:"condition",expression:"action == 'A1'",within:[1,1],steps:[
        {type:"selection",name:"1",dimensions:["action"],fields:[{name:"count", expression:"count()"}]},
        {type:"condition",expression:"action == 'A2'",within:[1,1],steps:[
          {type:"selection",name:"2",dimensions:["action"],fields:[{name:"count", expression:"count()"}]}
        ]}
      ]}
    ]
  };
  var results = {
    "0":{"action":{"A0":{"count":10}, "A1":{"count":20}}},
    "1":{"action":{"A0":{"count":30},"A2":{"count":5}}},
    "2":{"action":{"A3":{"count":5},"A4":{"count":4},"A5":{"count":1},"A6":{"count":1}}},
  };
  var nodes = skybox.explore.normalize(query, results, {limit:3});

  equal([
    {id:"0.A1", title:"A1", value:20, depth:0},
    {id:"0.A0", title:"A0", value:10, depth:0},
    {id:"1.A0", title:"A0", value:30, depth:1},
    {id:"1.A2", title:"A2", value:5, depth:1},
    {id:"2.A3", title:"A3", value:5, depth:2},
    {id:"2.A4", title:"A4", value:4, depth:2},
    {id:"2.__other__", title:"Other", value:2, depth:2},
  ], nodes);
});

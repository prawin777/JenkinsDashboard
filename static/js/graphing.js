function countResults(data, clearDate){
    errors = {};
    fails = {};
    passes = {};
    xfails = {};
    skips = {};
    builds = {};
    uxpass = {};
    for(var i = 0; i < data.length; i++){
        date = new Date(data[i].date*1000);
        if(clearDate){
            date.setHours(0,0,0,0);
        }
        date = date.valueOf();
        if(!passes[date]){
            passes[date] = 0;
        } if(!fails[date]){
            fails[date] = 0;
        } if(!errors[date]){
            errors[date] = 0;
        } if(!skips[date]){
            skips[date] = 0;
        } if(!xfails[date]){
            xfails[date] = 0;
        } if(!uxpass[date]){
            uxpass[date] = 0;
        } if(!builds[date]){
            builds[date] = [];
        }
        builds[date].push(data[i].build);
        for(var j = 0; j < data[i].test_list.length; j++){
            test_list = data[i].test_list;
            if(test_list[j].result == "Passed"){
                passes[date]++;
            } else if(test_list[j].result == "Failure"){
                fails[date]++;
            } else if(test_list[j].result == "Error"){
                errors[date]++;
            } else if(test_list[j].result == "Expected Failure"){
                xfails[date]++;
            } else if(test_list[j].result == "Skipped"){
                skips[date]++;
            } else if(test_list[j].result == "Unexpected Pass"){
                uxpass[date]++;
            }
        }
    }
    return {passes: passes,
            fails: fails,
            errors: errors,
            skips: skips,
            xfails: xfails,
            skips: skips,
            uxpass: uxpass,
            builds: builds
        }
}
function keysToXY(object){
    xy = [];
    keys = Object.keys(object);
    keys.sort();
    for(var i = 0; i < keys.length; i++){
        key = + keys[i]
        key = key/1000
        xy[i] = {x:key, y:object[keys[i]]}
    }
    return xy
}

var baseWidth = 810;
var baseHeight = 375;
var scaler = .9;
function makeGraph(data, width, height, clearDate){
    var results = countResults(data, clearDate);
    var renderer;
    if(window.innerWidth < 866){
        var modifier = window.innerWidth/866*scaler;   
    } else{
        var modifier = 1;
    }
    if(clearDate){
        renderer = "bar";
    }else{
        renderer = "area"
    }
    var graph = new Rickshaw.Graph({
        element: document.querySelector("#chart"),
        renderer: renderer,
        interpolation: "linear",
        stacked: true,
        stroke: true,
        width: width*modifier,
        height: height*modifier,
        builds: results.builds,
        series: [{
            name: "Passes",
            data: keysToXY(results.passes),
            color: "SeaGreen"
        }, {
            name: "Fails",
            data: keysToXY(results.fails),
            color: "salmon"
        }, {
            name: "Errors",
            data: keysToXY(results.errors),
            color: "firebrick"
        }, {
            name: "Skips",
            data: keysToXY(results.skips),
            color: "darkKhaki"
        }, {
            name: "X-Fails",
            data: keysToXY(results.xfails),
            color: "DarkOrange"
        }, {
            name: "UX-Passes",
            data: keysToXY(results.uxpass),
            color: "SteelBlue"
        }]
    });
    var x_axis = new Rickshaw.Graph.Axis.Time({
            graph: graph,
            timeFixture: new Rickshaw.Fixtures.Time.Local()
        });
    var y_axis = new Rickshaw.Graph.Axis.Y( {
        graph: graph,
        height: baseHeight*modifier,
        orientation: 'left',
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        element: document.getElementById('yaxis')
    } );
    var hoverDetail = new Rickshaw.Graph.HoverDetail( {
        graph: graph,
        xFormatter: function(x) {
            if(clearDate){
                return new Date(x * 1000).toDateString()+"<br>Build(s): "+ builds[x*1000].toString().replace(/\,/g, " ");
            } else{
                return new Date(x * 1000).toString()+"<br>Build(s): "+ builds[x*1000].toString().replace(/\,/g, " ")
            }
        }
    } );

    var legend = new Rickshaw.Graph.Legend( {
        graph: graph,
        element: document.getElementById('legend')
    } );
    var shelving = new Rickshaw.Graph.Behavior.Series.Toggle( {
        graph: graph,
        legend: legend
    } );
    graph.render();
    // var preview = new Rickshaw.Graph.RangeSlider( {
    // graph: graph,
    // element: document.getElementById('preview'),
    // } );
    if(clearDate){
    $('#chart').on('click',
        function() {
            var s = new Date($("#chart .detail .x_label").text().split('Build(s)')[0]);
            window.location = s.getFullYear()+"/"+(s.getMonth()+1)+"/"+s.getDate();
        });
    }else{
        $('#chart').on('click',
        function(){
            var s = $("#chart .detail .x_label").text().split('Build(s)')[1].split(' ')[1];
            splitURL = document.URL.split('/')
            window.location = "/job/"+splitURL[splitURL.indexOf('job')+1]+"/"+s
        })
    }
    return {graph: graph, y: y_axis};
}
var graphStuff = makeGraph(test_data, baseWidth, baseHeight, clearDate);

$(window).resize(function() {
    if(window.innerWidth > 866){
        if(graphStuff.graph.width < baseWidth){
            graphStuff.graph.configure({
                width: baseWidth,
                height: baseHeight
            })
            $('#chart svg').attr('width', baseWidth)
                .attr('height', baseWidth)
            graphStuff.graph.render();
        }
    }
    else{
        if(window.innerWidth < 371){
            modifier = 371/866*scaler;
        } else{
            modifier = window.innerWidth/866*scaler;
        }
        graphStuff.graph.configure({
            width: baseWidth*modifier,
            height: baseHeight*modifier
        })
        $('#chart svg').attr('width', baseWidth*modifier)
            .attr('height', baseHeight*modifier)
        graphStuff.y.height = baseWidth*modifier; 
        graphStuff.graph.render();
        graphStuff.y.render();
    }

});
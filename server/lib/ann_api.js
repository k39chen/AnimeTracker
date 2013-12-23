var require = Npm.require,
    xml2js = require('xml2js'),
    Future = require('fibers/future');

Meteor.methods({

    getSampleXMLResponse: function(){

        var future = new Future();

        var data = "<root>" +
            "<group>" +
                "<item name=\"test1\">test data 1</item>"+
                "<item name=\"test2\">test data 2</item>"+
                "<item name=\"test3\">test data 3</item>"+
            "</group>"+
        "</root>";

        var parser = new xml2js.Parser({trim:true});

        parser.parseString(data, function(err,result){
            console.log(result);
            // return the parsed response
            future['return'](result);
        });

        // wait for async to finish before returning the result
        return future.wait();
    }

});
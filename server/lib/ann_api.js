Meteor.methods({

    getSampleXMLResponse: function(){
        var xml = ""+
        "<root>"+
            "<group>"+
                "<item name=\"test1\">test data 1</item>"+
                "<item name=\"test2\">test data 2</item>"+
                "<item name=\"test3\">test data 3</item>"+
            "</group>"+
        "</root>";
        return XML2JS.parse(xml);
    }

});
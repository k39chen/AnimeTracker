Meteor.startup(function(){
	console.log("Hello World!");

	parseXml();
	startCronJob();
});

function parseXml() {

	var strXML = "<root>" +
        "<group>" +
            "<item name=\"test1\">test data 1</item>"+
            "<item name=\"test2\">test data 2</item>"+
            "<item name=\"test3\">test data 3</item>"+
        "</group>"+
    "</root>";

}

function startCronJob() {
	var job = new Cron.Job(new Cron.Spec('*/2 * * * * *'), function(){
		console.log(new Date());
	});
	var cron = new Cron();
	cron.start();
	cron.add(job);
}
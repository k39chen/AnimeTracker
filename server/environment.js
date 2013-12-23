var require = Npm.require;

Meteor.startup(function(){
    console.log("Hello World!");

    //startCronJob();
});

function startCronJob() {
    var job = new Cron.Job(new Cron.Spec('*/2 * * * * *'), function(){
        console.log(new Date());
    });
    var cron = new Cron();
    cron.start();
    cron.add(job);
}
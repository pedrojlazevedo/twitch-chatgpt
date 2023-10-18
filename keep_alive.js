import cron from 'cron';
import https from 'https';

const render_url = "https://osetinhas-bot.herokuapp.com/render"
const job = new cron.CronJob('*/14 * * * *', function() {
    console.log('Making keep alive call');

    https.get(render_url, (resp) => {
        if (resp.statusCode === 200) {
            console.log("Keep alive call successful");
        } else {
            console.log("Keep alive call failed");
        }
    }).on("error", (err) => {
        console.log("Error making keep alive call");
    });

});

module.exports = {job};

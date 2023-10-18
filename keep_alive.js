import cron from 'cron';
import https from 'https';

// get env RENDER_EXTERNAL_URL
const render_url = process.env.RENDER_EXTERNAL_URL

if (!render_url) {
    console.log("No RENDER_EXTERNAL_URL found. Please set it as environment variable.")
}

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

export {job};

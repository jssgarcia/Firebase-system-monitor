const { exec } = require('child_process');

//exec('cat *.js missing_file | wc -l', (error, stdout,stderr) => {
exec('node error_msg.js', (err, stdout,stderr) => {
    if (err) {
        console.error(`exec error: ${err}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
})
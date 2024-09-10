'use strict';
/*
    This module is a support module for iobroker.repochecker

    Area checked:   LICENSE file
    Numbering   :   700 - 799

*/

const execSync = require('node:child_process').execSync;

const common = require('./common.js');

function getAuthor(author) {
    if (author && typeof author === 'object') {
        return `${author.name} <${author.email}>`;
    } else {
        return author;
    }
}

async function checkLicenseFile(context) {
    // https://raw.githubusercontent.com/userName/ioBroker.adaptername/${context.branch}/LICENSE
    console.log('\ncheckLicenseFile [E7xx]');

    const data = await common.downloadFile(context.githubUrl, '/LICENSE');
    if (!data) {
        context.errors.push('[E701] NO LICENSE file found, please add it.');
    } else {
        context.checks.push('LICENSE file found');

        let npmYear = 0;
        try {
            const result = execSync(`npm view iobroker.${context.adapterName} --json`, { encoding: 'utf-8' });
            const npmJson = JSON.parse(result);
            //console.log(`[DEBUG] ${JSON.stringify(npmJson)}`);
            if (npmJson['dist-tags'] && npmJson['dist-tags'].latest) {
                const latest = npmJson['dist-tags'].latest;
                const timeStr = npmJson.time[latest];
                npmYear = new Date(timeStr).getFullYear();
            }
        } catch (e) {
            console.log(`Error executing "npm view" - ${e}`);
        }

        if (context.packageJson.license === 'MIT') {
            const text = data;
            const year = new Date().getFullYear();
            const commitYear = context.lastCommitYear || 0;
            let licenseYear = 0;
            let m = text.match(/\d\d\d\d\s*-\s*(\d\d\d\d)/);
            if (m) {
                licenseYear = Number(m[1]);
            }
            m = text.match(/(\d\d\d\d)/);
            if (m) {
                if (Number(m[1])>licenseYear) {
                    licenseYear = Number(m[1]);
                }
            }

            console.log(`License year ${licenseYear}`);
            console.log(`Current year ${year}`);
            console.log(`Commit year ${commitYear}`);
            console.log(`NPM year ${npmYear}`);

            const valid = (licenseYear === year || licenseYear >= commitYear || licenseYear >=npmYear);
            if (!valid) {
                const m = text.match(/(\d\d\d\d)-\d\d\d\d/);
                if (m) {
                    context.errors.push(`[E701] No actual year found in LICENSE. Please add "Copyright (c) ${m[1]}-${year} ${getAuthor(context.packageJson.author)}" at the start of LICENSE`);
                } else {
                    context.errors.push(`[E701] No actual year found in LICENSE. Please add "Copyright (c) ${year} ${getAuthor(context.packageJson.author)}" at the start of LICENSE`);
                }
            } else {
                context.checks.push('Valid copyright year found in LICENSE');
            }
        }
    }
    return context;
}

exports.checkLicenseFile = checkLicenseFile;
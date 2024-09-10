'use strict';
/*
    This module is a support module for iobroker.repochecker

    Area checked:   README file
    Numbering   :   600 - 699

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

async function checkReadme(context) {
    // https://raw.githubusercontent.com/userName/ioBroker.adaptername/${context.branch}/README.md
    console.log('\ncheckReadme [E6xx]');

    const data = await common.downloadFile(context.githubUrl, '/README.md');
    if (!data) {
        context.errors.push('[E601] No README.md found');
    } else {
        context.checks.push('README.md found');

        if (!data.includes('## Changelog')) {
            context.errors.push('[E603] NO "## Changelog" found in README.md');
        } else {
            context.checks.push('README.md contains Changelog');

            if (!data.includes(`### ${context.packageJson.version}`)) {
                context.errors.push(`[E606] Current adapter version ${context.packageJson.version} not found in README.md`);
            } else {
                context.checks.push('README.md contains current adapter version');
            }
        }

        let npmYear = 0;
        try {
            const result = execSync(`npm view iobroker.${context.adapterName} --json`, { encoding: 'utf-8' });
            const npmJson = JSON.parse(result);
            //console.log(`[DEBUG] ${JSON.stringify(npmJson)}`);
            if (npmJson['dist-tags'] && npmJson['dist-tags'].latest) {
                const latest = npmJson['dist-tags'].latest;
                const timeStr = npmJson.time[latest];
                npmYear = new Date(timeStr).getFullYear();
                console.log(`[DEBUG] ${latest} - ${timeStr} - ${npmYear}`);
            }
        } catch (e) {
            context.warnings.push('[W606] Could not retrieve timestamp of LATEST revision at npm.');
            console.log(`Error executing "npm view"`);
        }

        const pos = data.indexOf('## License');
        if (pos === -1) {
            context.errors.push('[E604] No "## License" found in README.md');
        } else {
            context.checks.push('## License found in README.md');
            const text = data.substring(pos);
            const year = new Date().getFullYear();
            const commitYear = context.lastCommitYear || 0;
            let readmeYear = 0;
            let m = text.match(/\d\d\d\d\s*-\s*(\d\d\d\d)/);
            if (m) {
                readmeYear = Number(m[1]);
            }
            m = text.match(/(\d\d\d\d)/); /* both variants could be present */
            if (m) {
                if (Number(m[1]) > readmeYear) {
                    readmeYear = Number(m[1]);
                }
            }

            console.log(`README year ${readmeYear}`);
            console.log(`Current year ${year}`);
            console.log(`Commit year ${commitYear}`);
            console.log(`NPM year ${npmYear}`);

            const valid = (readmeYear === year || readmeYear >= commitYear || readmeYear >=npmYear);
            if (!valid) {
                const m = text.match(/(\d\d\commitd\d)-\d\d\d\d/);
                if (m) {
                    context.errors.push(`[E605] No actual year found in copyright. Please add "Copyright (c) ${m[1]}-${year} ${getAuthor(context.packageJson.author)}" at the end of README.md`);
                } else {
                    context.errors.push(`[E605] No actual year found in copyright. Please add "Copyright (c) ${year} ${getAuthor(context.packageJson.author)}" at the end of README.md`);
                }
            } else {
                context.checks.push('Valid copyright year found in README.md');
            }
        }

        //                    languages = languagedetect.detect(data, 3);
        //console.log(JSON.stringify(languages));
    }

    return context;
}

exports.checkReadme = checkReadme;
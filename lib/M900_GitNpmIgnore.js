'use strict';
/*
    This module is a support module for iobroker.repochecker

    Area checked:   .gitignore, .npmignore
    Numbering   :   900 - 998

    NOTE: requires filesList to be loaded
*/

/* 
    TODO: 
    - something is wrong with undefined 'check' variable 
*/

// const common = require('./common.js');

function paddingNum(num) {
    if (num >= 10) return num;
    return '0' + num;
}

// 900 - ???
async function checkGitIgnore(context) {

    const checkFiles = [
        '.idea',
        'tmp',
        'node_modules',
        'iob_npm.done',
    ];

    // https://raw.githubusercontent.com/userName/ioBroker.adaptername/${context.branch}/.gitignore
    console.log('\ncheckGitIgnore [E9xx]');

    if (!context.filesList) {
        throw('FATAL:context.fileslist is undefined');
    }

    if (!context.filesList.includes('.gitignore')) {
        context.errors.push(`[E901] .gitignore not found`);
    } else {
        const rules = (context['/.gitignore'] || '').split('\n').map(line => line.trim().replace('\r', '')).filter(line => line);
        rules.forEach((name, i) => {
            if (name.includes('*')) {
                rules[i] = new RegExp(name
                    .replace('.', '\\.')
                    .replace('/', '\\/')
                    .replace('**', '.*')
                    .replace('*', '[^\\/]*')
                );
            }
        });

        /* TODO: something is wrong with undefined 'check' variable 
        if (!rules.includes('node_modules') && !rules.includes('/node_modules') && !rules.includes('/node_modules/*') && !rules.includes('node_modules/*')) {
            !check && context.errors.push(`[E902] node_modules not found in .npmignore`);
        }
        if (!rules.includes('iob_npm.done') && !rules.includes('/iob_npm.done')) {
            !check && context.errors.push(`[E903] iob_npm.done not found in .gitignore`);
        }
        */

        checkFiles.forEach(file => {
            if (context.filesList.includes(file)) {
                // maybe it is with regex
                const check = rules.some(rule => {
                    if (typeof rule === 'string') {
                        return rule === file || rule === file.replace(/\/$/, '');
                    } else {
                        return rule.test(file);
                    }
                });

                !check && context.errors.push(`[E904] file ${file} found in repository, but not found in .gitignore`);
            }
        });
    }

    return context;
}

// 950 - ???
async function checkNpmIgnore(context) {
    const checkFiles = [
        'node_modules/',
        'test/',
        'src/',
        'appveyor.yml',
        '.travis.yml',
        'tsconfig.json',
        'tsconfig.build.json',
        'iob_npm.done',
        //         '.git/',
        //         '.github/',
        //         '.idea/',
        //         '.gitignore',
        //         '.npmignore',
        //         '.travis.yml',
        //         '.babelrc',
        //         '.editorconfig',
        //         '.eslintignore',
        //         '.eslintrc.js',
        //         '.fimbullinter.yaml',
        //         '.lgtm.yml',
        //         '.prettierignore',
        //         '.prettierignore',
        //         '.prettierrc.js',
        //         '.vscode/',
    ];

    // https://raw.githubusercontent.com/userName/ioBroker.adaptername/${context.branch}/.npmignore
    console.log('\ncheckNpmIgnore [E95x]');
    if (context.packageJson.files && context.packageJson.files.length) {
        if (context.filesList.includes('.npmignore')) {
            context.warnings.push(`[E951] .npmignore found but "files" is used at package.json. Please remove .npmignore.`);
        } else {
            context.checks.push('package.json "files" already used.');
        }
        return Promise.resolve(context);
    }

    // package.json files section is NOT used
    if (!context.filesList.includes('.npmignore')) {
        context.warnings.push(`[E952] .npmignore not found`);
    } else {
        context.warnings.push(`[W953] .npmignore found - consider using package.json object "files" instead.`);

        const rules = (context['/.npmignore'] || '').split('\n').map(line => line.trim().replace('\r', '')).filter(line => line);
        let tooComplexToCheck = false;
        rules.forEach((name, i) => {
            if (name.includes('*')) {
                rules[i] = new RegExp(name
                    .replace('.', '\\.')
                    .replace('/', '\\/')
                    .replace('**', '.*')
                    .replace('*', '[^\\/]*')
                );
            }
            if (name.startsWith('!')) {
                tooComplexToCheck = true;
            }
        });

        // There's no need to put node_modules in `.npmignore`. npm will never publish node_modules in the package, except if one of the modules is explicitly mentioned in bundledDependencies.
        /*if (!rules.includes('node_modules') && !rules.includes('/node_modules') && !rules.includes('/node_modules/*') && !rules.includes('node_modules/*')) {
            !check && context.errors.push(`[E954] node_modules not found in `.npmignore``);
        }*/
        if (!tooComplexToCheck) {
            if (!rules.includes('iob_npm.done') && !rules.includes('/iob_npm.done')) {
                /*!check &&*/ context.errors.push(`[E953] iob_npm.done not found in .npmignore`);
            }

            checkFiles.forEach((file, i) => {
                if (context.filesList.includes(file)) {
                    // maybe it is with regex
                    const check = rules.some(rule => {
                        if (typeof rule === 'string') {
                            return rule === file || rule === file.replace(/\/$/, '');
                        } else {
                            return rule.test(file);
                        }
                    });

                    !check && context.errors.push(`[E9${paddingNum(i + 61)}] file ${file} found in repository, but not found in .npmignore`);
                }
            });
        }
    }
    return context;
}

exports.checkGitIgnore = checkGitIgnore;
exports.checkNpmIgnore = checkNpmIgnore;
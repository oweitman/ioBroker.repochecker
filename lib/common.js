'use strict';
/*
    This module contains genaral utility routines for iobroker.repochecker

*/
const axios = require('axios');
const fs = require('node:fs/promises');
const compareVersions = require('compare-versions');
const semverValid = require('semver/functions/valid');

// disable axios caching
axios.defaults.headers.common = {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0',
};

let gDebug = false;
let gInfo = false;
let gLocal = false;

// function log(msg) {
//     console.log(`${msg}`);
// }

function debug(msg) {
    gDebug && console.log(`${msg ? '[DEBUG] ' : ''}${msg}`);
}

function info(msg) {
    gInfo && console.log(`${msg ? '[INFO] ' : ''}${msg}`);
}

function warn(msg) {
    console.log(`${msg ? '[WARNING] ' : ''}${msg}`);
}

function error(msg) {
    console.error(`${msg ? '[ERROR] ' : ''}${msg}`);
}

function isDebug() {
    return gDebug;
}

function isInfo() {
    return gInfo;
}

function isLocal() {
    return gLocal;
}

function setDebug(flag) {
    gDebug = flag;
    debug('debug messages have been enabled');
}

function setInfo(flag) {
    gInfo = flag;
    console.debug(`[INFO] info messages have been ${gInfo ? 'enabled' : 'disabled'}`);
}
function log(msg) {
    console.log(`${msg}`);
}
function warn(msg) {
    console.error(`${msg}`);
}
function error(msg) {
    console.error(`${msg}`);
}
function setLocal(flag) {
    gLocal = flag;
    debug(`[INFO] running in LOCAL mode`);
}

function isLocal() {
    return gLocal;
}

function checkLanguages(langObj, languages) {
    return languages.filter(lang => !langObj[lang]);
}

async function downloadFile(githubUrl, path, binary, noError) {
    if (!isLocal()) {
        debug(`Download ${githubUrl}${path || ''}`);
        const options = {};
        if (binary) {
            options.responseType = 'arraybuffer';
        }
        try {
            const response = await axios(githubUrl + (path || ''), options);
            debug(`download succeded`);
            return response.data;
        } catch (e) {
            (!noError || gDebug) && error(`Cannot download ${githubUrl}${path || ''} ${e}`);
            throw e;
        }
    } else {
        debug(`Download local ${path || ''}`);
        // remove first / from path
        path = path.replace(/^\/+/, '');
        const file = await fs.readFile(path, binary ? null : 'utf8');
        return file;
    }
}

function getDependencyArray(deps) {
    return deps
        .map(dep => (typeof dep === 'object' ? Object.keys(dep) : [dep]))
        .reduce((acc, dep) => acc.concat(dep), []);
}

// dependencies might be:
// [
//    {"js-controller":">=1.2.3"}
// ]
// or
// [
//    {"js-controller":">=1.2.3"},
//    {"vis":">=1.2.3"}
// ]
// or
// [
//    {
//      "js-controller":">=1.2.3",
//      "vis":">=1.2.3"
//    }
// ]
// or
// [
//    {"js-controller":">=1.2.3"},
//    "vis"
// ]
function getDependencies(deps) {
    const ret = {};
    debug(`deps: ${JSON.stringify(deps)}, type ${typeof deps}`);
    if (deps instanceof Array) {
        for (const dep of deps) {
            if (typeof dep === 'object') {
                for (const key in dep) {
                    ret[key] = dep[key];
                }
            } else {
                ret[dep] = '>=0';
            }
        }
    }
    debug(`ret: ${JSON.stringify(ret)}`);
    return ret;
}

/*
    return the greater of two semver versions
*/
function maxVersion(v1, v2) {
    if (compareVersions.compareVersions(v1, v2) > 0) {
        return v1;
    }
    return v2;
}

/*
    analyzes a semver string
*/
function parseSemver(p_semver) {
    // common.log(`parseSemver(${p_semver})`);
    const ret = {
        valid: false,
        rangeOp: '',
        trimmed: false,
        version: '',
    };

    const semver = p_semver.trim();
    ret.trimmed = semver !== p_semver;
    ret.version = semver;
    ret.uncompressed = false;

    const m = semver.match(/^(\^|~|>|>=|<|<=)?(\s*)(.*)$/);
    if (m) {
        // common.log(m);
        ret.rangeOp = m[1];
        ret.uncompressed = m[2] !== '';
        ret.version = m[3];
    }
    ret.version = semverValid(ret.version) || '';
    ret.valid = semverValid(ret.version) !== undefined;
    // common.log(JSON.stringify(ret));
    return ret;
}

function validateSemver(p_semver) {
    //common.log(`validateSemver(${p_semver})`);
    const ret = parseSemver(p_semver);
    return ret.valid && !ret.uncompressed;
}

exports.debug = debug;
exports.log = log;
exports.info = info;
exports.error = error;
exports.warn = warn;
exports.setLocal = setLocal;
exports.isLocal = isLocal;
exports.isDebug = isDebug;
exports.isInfo = isInfo;

exports.setDebug = setDebug;
exports.setInfo = setInfo;
exports.setLocal = setLocal;

exports.checkLanguages = checkLanguages;
exports.downloadFile = downloadFile;
exports.getDependencyArray = getDependencyArray;
exports.getDependencies = getDependencies;
exports.maxVersion = maxVersion;
exports.parseSemver = parseSemver;
exports.validateSemver = validateSemver;

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const chalk = require('chalk');
const _ = require('lodash');
const shell = require('shelljs');
const request = require('request');


const gitRepoNameCmd = `git config --get remote.origin.url`;
const gitRepoNameOutput = shell.exec(gitRepoNameCmd, {silent: true}).output.split('\n')[0];
const repoReg = /^.*\.com:(.+)+.git?$/i;
const repo = gitRepoNameOutput.match(repoReg)[1];

const projRoot = process.env.PWD;
const changeLogJsonFilename = '.changelog.json';
const changeLogJsonPath = path.join(projRoot, changeLogJsonFilename);
const changeLogJson = getChangeLogJson(changeLogJsonPath);
const changeLogMarkdownFilename = 'CHANGELOG.md';
const changeLogDestPath = path.join(projRoot, changeLogMarkdownFilename);
const userTokenFilename = '.github';
const githubTokenPath = path.join(os.homedir(), userTokenFilename);
const userToken = getUserToken(githubTokenPath);
let labels = [];

if (!changeLogJson) {
  console.log(chalk.red(`Change log json file at "~/${changeLogJsonFilename}" is required to modify the CHANGELOG.md`)); // eslint-disable-line no-console
  process.exit(1);

  return;
}

if (!userToken) {
  console.log(chalk.red(`Auth token file at "~/${userTokenFilename}" is required to create pull requests.`)); // eslint-disable-line no-console
  process.exit(1);

  return;
}

const reqOpts = {
  uri: `https://api.github.com/repos/${repo}/labels`,
  headers: {
    'User-Agent': repo
  },
  json: true
};

request(reqOpts, function(err, results) {
  if (err) {
    throw err;
  }
  else if (results && results.statusCode !== 200) {
    return console.log( // eslint-disable-line no-console
      chalk.red(`There was a problem pulling labels from ${repo}:\n${JSON.stringify(results.body, null, 2)}`)
    );
  }

  labels = results.body;

  generateChangeLogFromJson(changeLogJson);
});

function getChangeLogJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.readFileSync(filePath, 'utf-8').toString();
}

function generateChangeLogFromJson(json) {
  const versions = JSON.parse(json);

  const lines = [`# Change Log`];

  _.each(versions, function(v) {
    lines.push(`\n## v${v.version}\n`);

    _.each(v.changes, function(c) {
      lines.push(`* ${c.description}${getIssues(c)}`);
    });
  });

  writeChangeLog(lines.join('\n'));
}

function getIssues(change) {
  const gitIssueRootUrl = `https://github.com/utopias/hello-world/issues/`;

  if (!change.issueIds || !change.issueIds.length) {
    return `${getLabels(change)}`;
  }

  if (change.issueIds.length === 1) {
    return ` [${change.issueIds[0]}](${gitIssueRootUrl}${change.issueIds[0]})${getLabels(change)}`;
  }

  return _
    .map(change.issueIds, function(id) {
      return `\n  * [${id}](${gitIssueRootUrl}${id})${getLabels(change)}`;
    })
    .join('')
    ;

  // https://api.github.com/repos/utopias/hello-world/issues/1/labels
}

function getLabels(change) {
  if (!change.labels || !change.labels.length) {
    return '';
  }

  return _
    .map(change.labels, function(label) {
      const dLabel = _.find(labels, {name: label});

      return ` ![${dLabel.name}](http://dummyimage.com/14x14/${dLabel.color}/ffffff.png&text=%20)`;
    })
    .join('')
    ;
}

function getUserToken(filepath) {
  if (!fs.existsSync(filepath)) {
    return null;
  }

  return fs.readFileSync(filepath, 'utf-8').toString();
}

function writeChangeLog(contents) {
  fs.writeFileSync(changeLogDestPath, contents, 'utf-8');
}

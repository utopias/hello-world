#!/usr/bin/env node
'use strict';

const fs = require('fs');
const cwd = require('cwd');
const chalk = require('chalk');

const INVALID_MSG_PREFIX = `Invalid commit message:`;
const MAX_COMMENT_LENGTH = 50;
const regexes = {
  issue: /([A-Z][A-Z][A-Z]*-[1-9][\d]*)+/g, // JIRA-123
  time: /(#time([ ]+[\d]([.]([\d]+))?[wdhm]?)+)+/g, // #time 4h
  comment: /(#comment([ ]+[^#]+))+/g // #comment ...
};

fs.readFile(cwd('.git/COMMIT_EDITMSG'), 'utf-8', validateCommitMessage);

function validateCommitMessage(err, stream) {
  const msg = stream.toString() || '';
  const errors = [];
  let isValid = true;

  if (isValid) {
    // Make sure at least one issue number is there
    isValid = (msg.match(regexes.issue) || []).length === 1;

    if (!isValid) {
      errors.push({message: `Must contain at least one valid issue number.`, detail: `E.g., ABC-123`});
    }
  }

  if (isValid) {
    // Make sure only one #time is there
    const timeMatches = (msg.match(regexes.time) || []).length;

    switch (timeMatches) {
      case 1:
        // All good, only one match should have been provided
        break;
      default:
        // Uh oh, zero or multiple #time tags were found
        if (timeMatches < 1) {
          errors.push({message: `Must have a #time value.`, detail: `E.g., #time 4[wdhm]`});
        }
        else if (timeMatches > 1) {
          errors.push({message: `Must have a single #time value.`, detail: `${timeMatches} found.`});
        }

        isValid = false;

        break;
    }
  }

  if (isValid) {
    // Make sure a comment is provided
    const tMsg = getFullComment(msg);

    isValid = regexes.comment.exec(msg);

    if (!isValid) {
      // Parse out all found tokens to see if there is any remaining text because that could be a valid comment (#comment is optional)
      isValid = tMsg.length > 0;

      if (!isValid) {
        errors.push({
          message: `Must contain a valid comment. Add a message or explicitly call out using the #comment tag.`,
          detail: `E.g., #comment <message goes here>`
        });
      }
    }

    if (isValid) {
      // Has a comment, check total length
      isValid = tMsg.length <= MAX_COMMENT_LENGTH;

      if (!isValid) {
        const fMsg = `${tMsg.slice(0, MAX_COMMENT_LENGTH)}${chalk.yellow(`_${tMsg.slice(MAX_COMMENT_LENGTH)}`)}`;

        errors.push({
          message: `Comment length is too long.`,
          detail: `The comment is ${tMsg.length - MAX_COMMENT_LENGTH} characters over the maximum ${MAX_COMMENT_LENGTH}.`,
          data: `  ${fMsg}`
        });
      }
    }
  }

  if (!isValid) {
    // Output errors
    errors.forEach(function(err) {
      console.log(chalk.red(`${INVALID_MSG_PREFIX} ${err.message} ${err.detail || ''}`)); // eslint-disable-line

      if (err.data) {
        console.log(err.data); // eslint-disable-line
      }
    });

    process.exit(1);
  }

  process.exit(0);
}

// Parse comments out of message
function getFullComment(msg) {
  const regComment = /[ ]?#comment/ig;
  const regDoubleWhitespace = /[ ][ ]/ig;

  let tMsg = msg;

  tMsg = tMsg.replace(regComment, ''); // Remove all #comment tags
  tMsg = tMsg.replace(regexes.issue, ''); // Remove all issue numbers
  tMsg = tMsg.replace(regexes.time, ''); // Remove all times
  tMsg = tMsg.replace(regDoubleWhitespace, ' '); // Replace double whitespaces with single spaces
  tMsg = tMsg.trim(); // Trim start and end whitespace

  return tMsg;
}

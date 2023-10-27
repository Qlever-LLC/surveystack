// /////////////// RELEVANCE //////////////////////////

// KNOWN BUGS TO IMPROVE
// if relevance is turned off up the chain, then we won't catch it.
// if relevance is false, then false
// if relevance is true, then true
// if relevance is undefined, then walk back the tree.  If anywhere there is
// relevance = false, then set false.  Otherwise, set true.

function match(answers, thisValue) {
  if ((typeof thisValue === 'string' || typeof thisValue === 'number') && answers.includes(thisValue)) {
    return true;
  }
  return false;
}

/**
 * checkIfAny  checks the answer against 'answer' and checks for relevance
 * works with strings and arrays (for array, use .includes())
 * if question isn't answered (=== null), will return false
 * 'answer' is optional, if not provided it just checks for relevance
 *
 * @param {object} question you're asking about
 * @param {answer} answer(s) (strings or numbers) to check against
 */
export function checkIfAny(question, ...answers) {
  // answers is always passed as an array!
  let values = question.value;
  // return false if question is not relevant
  if (
    typeof question.meta !== 'undefined' &&
    typeof question.meta.relevant !== 'undefined' &&
    question.meta.relevant === false
  ) {
    // console.log(`answer: ${JSON.stringify(answers)}
    // question.value: ${JSON.stringify(values)}
    // returned: false
    // reason: not relevant`);
    return false;
  }
  // if no 'answer' provided and question is relevant, then return true
  if (answers.length === 0) {
    // console.log(`answer: ${JSON.stringify(answers)}
    // question.value: ${JSON.stringify(values)}
    // returned: true
    // reason: relevant and no answer to check against`);
    return true;
  }
  // now check if answer is provided...
  // it's easiest to convert to array... if you check against raw null you'll get true regardless, but not so when null is in an array using includes()
  // then check all possibly answers against all possible questions
  // if there's a match, return true
  if (!Array.isArray(values)) {
    values = [values];
  }
  if (values[0] === null) {
    // console.log(`answer: ${JSON.stringify(answers)}
    // question.value: ${JSON.stringify(values)}
    // returned: false
    // reason: relevant but unanswered`);
    return false;
  }
  if (values.some((thisValue) => match(answers, thisValue))) {
    // works for 0, 'a string', '',
    // console.log(`answer: ${JSON.stringify(answers)}
    // question.value: ${JSON.stringify(values)}
    // returned: true
    // reason: relevant, answered and contained answer(s) provided`);
    return true;
  }
  // console.log(`answer: ${JSON.stringify(answers)}
  // question.value: ${JSON.stringify(values)}
  // returned: false
  // reason: relevant, answered but does not contain answer(s) provided`);
  return false;
}

/**
 * checkIfNone  checks the answer from the question against 'answers' provided and says true only if 1) it's answered, 2) NONE of the answers provided are there, and 3) the question is relevant
 * works with strings and arrays (for array, use .includes())
 * 'answer' is optional, if not provided it just checks for relevance
 * if question isn't answered (=== null), will also return false
 *
 * @param {object} question you're asking about
 * @param {answer} answer(s) (strings or numbers) to check against
 */
export function checkIfNone(question, ...answers) {
  let values = question.value;
  // return false if question is not relevant
  if (
    typeof question.meta !== 'undefined' &&
    typeof question.meta.relevant !== 'undefined' &&
    question.meta.relevant === false
  ) {
    // console.log(`answer: ${JSON.stringify(answers)}
    // question.value: ${JSON.stringify(values)}
    // returned: false
    // reason: not relevant`);
    return false;
  }
  // if no 'answer' provided and question is relevant, then return true
  if (answers.length === 0) {
    // console.log(`answer: ${JSON.stringify(answers)}
    // question.value: ${JSON.stringify(values)}
    // returned: true
    // reason: relevant and no answer to check against`);
    return true;
  }
  // now check if answer is provided...
  // it's easiest to convert to array... if you check against raw null you'll get true regardless, but not so when null is in an array using includes()
  // then check all possibly answers against all possible questions
  // if there's a match, return true
  if (!Array.isArray(values)) {
    values = [values];
  }
  if (values[0] === null) {
    // console.log(`answer: ${JSON.stringify(answers)}
    // question.value: ${JSON.stringify(values)}
    // returned: false
    // reason: relevant but is unanswered (null)`);
    return false;
  }
  if (!values.some((thisValue) => match(answers, thisValue))) {
    // console.log(`answer: ${JSON.stringify(answers)}
    // question.value: ${JSON.stringify(values)}
    // returned: true
    // reason: relevant, answered and contained none of the answer(s) provided`);
    return true;
  }
  // console.log(`answer: ${JSON.stringify(answers)}
  // question.value: ${JSON.stringify(values)}
  // returned: false
  // reason: relevant, answered but contains answer(s) provided`);
  return false;
}

// /////////////// API COMPOSE //////////////////////////

/**
 * clean result (check existence, check array, check relevance) from multiple choice select answer
 * @param {chooseMult} multiple choice select answer root (not .value!)
 */
export function getCleanArray(chooseMult) {
  let thisAnswer = [];
  // if it's not relevant or null, set it to empty array
  if (typeof chooseMult === 'undefined') {
    // question doesnt' exist
    return thisAnswer;
  }
  if (
    typeof chooseMult.meta !== 'undefined' && // question not relevant
    typeof chooseMult.meta.relevant !== 'undefined' &&
    chooseMult.meta.relevant === false
  ) {
    return thisAnswer;
  }
  if (chooseMult.value === null) {
    return thisAnswer; // question is null
  }
  thisAnswer = chooseMult.value; // if it's passed all that, set it to the value
  // this is a bug... but if it's a string, set it to an array with that string in it
  if (!Array.isArray(thisAnswer)) thisAnswer = [thisAnswer]; // ensure it's an array
  console.log(`clean ${chooseMult.value} to ${JSON.stringify(thisAnswer)}`);
  return thisAnswer;
}

/**
 * clean result (check existence, check string, check relevance) from single choice select answer
 * @param {chooseOne} single choice select answer root (not .value!)
 */
export function getClean(chooseOne) {
  let thisAnswer = '';
  // if it's not relevant or null, set it to empty string
  if (typeof chooseOne === 'undefined') {
    // question doesnt' exist
    return thisAnswer;
  }
  if (
    typeof chooseOne.meta !== 'undefined' && // question not relevant
    typeof chooseOne.meta.relevant !== 'undefined' &&
    chooseOne.meta.relevant === false
  ) {
    return thisAnswer;
  }
  if (chooseOne.value === null) {
    return thisAnswer; // question is null
  }
  if (Array.isArray(chooseOne.value)) {
    // if this happens to be an array, return the first item only
    thisAnswer = chooseOne.value[0]; // set it to the first object in the array
    console.log(`clean "${chooseOne.value[0]}" to "${thisAnswer}"`);
    return thisAnswer;
  } else {
    thisAnswer = chooseOne.value; // if it's a single string/number, return that
    console.log(`clean "${chooseOne.value}" to "${thisAnswer}"`);
    return thisAnswer;
  }
}

export async function getResourceAsText(resourceKey) {
  return parseText(await getResource(resourceKey));
}

export async function getResourceAsArrayBuffer(resourceKey) {
  return parseArrayBuffer(await getResource(resourceKey));
}

export async function getResource(resourceKey) {
  window.parent.postMessage(
    {
      type: 'REQUEST_RESOURCE',
      payload: { resourceKey },
    },
    '*'
  );

  return await new Promise(function (resolve, reject) {
    const handler = function (event) {
      if (
        event.data &&
        event.data.type === 'RETURN_RESOURCE' &&
        event.data.payload &&
        event.data.payload.resourceKey === resourceKey
      ) {
        resolve(event.data.payload.file);
        window.removeEventListener('message', handler);
      }
    };
    window.addEventListener('message', handler);
  });
}

async function parseText(file) {
  const reader = new FileReader();
  reader.readAsText(file);
  const result = await new Promise((resolve, reject) => {
    reader.onload = function (event) {
      resolve(reader.result);
    };
  });
  return result;
}

async function parseArrayBuffer(file) {
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);
  const result = await new Promise((resolve, reject) => {
    reader.onload = function (event) {
      resolve(reader.result);
    };
  });
  return result;
}

const unstable = {
  /*
   * Find a nested item inside a JSON object.
   * Pass the object and the string referencing the location.
   * Returns the object in that location.
   *
   * ### Example
   * let submission = { this: { that: { theOther: 55} } }
   * dig(submission, 'this.that.theOther'); // returns 55
   * dig(submission, 'this.that[theOther]'); // returns 55 (this notation also works!)
   * now imagine we are passed the full reference and want to use dig.  Let's use getRoot and removeRoot also -->
   * refText = submission.this.that.theother;
   * dig(getRoot(refText), removeRoot(refText)); // returns 55
   * @param {object} the JSON object your looking in - this is usually 'submission' or 'parent'
   * @param {string} the location in the object.
   * robust, can accept null, undefined and will always pass back null
   */
  dig(object, path, defaultValue = null) {
    const chunks = path.split(/\.|\[|\]/).filter((d) => d.length !== 0);
    try {
      const value = chunks.reduce((current, chunk) => current[chunk], object);
      if (value !== undefined) {
        return value;
      } else {
        return defaultValue;
      }
    } catch (e) {
      return defaultValue;
    }
  },

  /*
   * Get and return a value, using previous functions
   * robust, can accept null, undefined and will always pass back null
   * @path {string} the string to get the value from.
   * @submission {object} survey submission object
   * @parent {object} survey parent object
   */
  get(path, submission, parent, defaultValue = null) {
    try {
      const obj = this.dig(this.getRoot(path, submission, parent), this.removeRoot(path));
      return obj;
    } catch (e) {
      return defaultValue;
    }
  },

  /**
   * getCleanNumber
   *
   * Output a number or a "" if it's not relevant or not a number, you may also specify precision
   * Helpfully also removes any annoying trailing zeroes if the value is more precise than precision specified
   * @object {num} single choice select answer root (not .value!)
   * @number {precision} desired precision of output (if not specificied, no precision applied)
   */
  getCleanNumber(num, sigFigs) {
    //    prettyLog('in getCleanNumeber', 'success');
    let val = utils.getClean(num);
    // return "" if getClean returns "", removes this edge case from the if/then list
    if (utils.getClean(num) === '') {
      val = '';
      // now Number() needs to return a valid number OR it needs to return 0 (which shows up as falsey but we want to pass it anyway since it's a numnber)
    } else if (Number(utils.getClean(num)) || Number(utils.getClean(num)) === 0) {
      if (sigFigs !== undefined) {
        val = Number(Number(val).toFixed(sigFigs)); // converts to string w/ sig figs, then back to number which removes trailing zeros
      } else {
        val = Number(utils.getClean(num));
      }
    } else {
      val = '';
    }
    // prettyLog(val);
    // prettyLog('leaving getCleanNumeber', 'success');
    return val;
  },

  /*
   * identify object root as referencing parent or the submission
   * return parent or submission objects
   * robust, can accept null, undefined and will always pass back null
   * @param {string} the location in the object.
   * @param {object} the `submission` object for the survey.
   * @param {object} the `parent` object for the survey.
   */
  getRoot(path, submission, parent, defaultValue = null) {
    if (typeof path !== 'string') {
      return defaultValue;
    } else if (/^parent+/g.test(path)) {
      return parent;
    } else if (/^submission+/g.test(path)) {
      return submission;
    } else {
      // if neither, assume parent.  add error checking here also
      return parent;
    }
  },

  /**
   * getSubmission
   *
   * Allows you to get a previous submission to test against quickly
   * Searches archived and non-archived, defaults to current survey ID but can specify another
   * @param {submission} current submission object (submission)
   * @param {submissionId} ID of the submission you want to test against
   * @param {surveyId} (optional) ID of the survey you want to find the submission in
   */
  async getSubmission(submission, submissionId, _surveyId = undefined) {
    let surveyId = _surveyId ? _surveyId : submission.meta.survey.id;
    try {
      // search in archived surveys first
      let url = `https://app.surveystack.io/api/submissions?survey=${surveyId}&match={"_id":{"\$oid":"${submissionId}"}}&showArchived=true`;
      this.prettyLog('check submission in archived url', 'info');
      this.prettyLog(url);
      let response = await fetch(url);
      let result = await response.text();
      result = JSON.parse(result);
      // if not present, search in non-archived surveys
      if (result.length === 0 || !result?.[0]?.data) {
        url = `https://app.surveystack.io/api/submissions?survey=${surveyId}&match={"_id":{"\$oid":"${submissionId}"}}`;
        this.prettyLog('check submission in non archived url', 'info');
        this.prettyLog(url);
        response = await fetch(url);
        result = await response.text();
        result = JSON.parse(result);
      }
      if (result?.[0]?.data) {
        submission = result[0]; // assign this so we can test against it
        this.prettyLog(`found: submission id ${submissionId}`, 'success');
        this.prettyLog(submission);
      } else {
        submission = {};
        this.prettyLog(
          `did not find the submission id ${submissionId}.  Try a different submission id or survey id`,
          'warning'
        );
        console.table(result);
      }
    } catch (error) {
      console.error(error);
    }
    return submission;
  },

  /**
   * lookupFromResource
   *
   * look up a row of values from one or more resources lists, returns those values
   * you may also specify which columns in the row you want to return.
   * @object {survey} the survey you'll be using to lookup the resource list
   * @array {resourceNames} the name of the resource list (slug name)
   * @string {lookup} the thing you're looking up
   * @string {lookupColumn} the column to search for the thing you're looking up
   * @string {returnColumns} which columns to include if this finds the row you're looking for
   */
  lookupFromResource(survey, resourceNames, lookup, lookupColumn, ...returnColumns) {
    let items;
    let foundFlag = 0; // flag to stop looking if you find it
    resourceNames.forEach((resourceName) => {
      if (!foundFlag) {
        const resource = survey.resources.find((object) => object.name === resourceName);
        if (resource && lookup) {
          items = resource.content.find((object) => object[lookupColumn] === lookup);
          if (typeof items === 'object' && !Array.isArray(items)) {
            this.prettyLog(`Found ${lookup} in ${resourceName}`, 'success');
            foundFlag = 1;
            if (returnColumns && returnColumns.length) {
              let someItems = {};
              returnColumns.forEach((column) => {
                if (items?.[column]) {
                  someItems[column] = items[column];
                } else {
                  this.prettyLog(`Did not find ${column} in ${lookup}`, 'warning');
                }
              });
              items = someItems;
            }
          } else {
            this.prettyLog(`Did not find ${lookup} in ${resourceName}`, 'info');
          }
        } else {
          if (!lookup) this.prettyLog(`Did not find Lookup field "${lookup}" in "${resourceName}" resource`, 'warning');
          if (!resource) this.prettyLog(`Did not find "${resourceName}" resource`, 'warning');
        }
      }
    });
    // if it's empty, return null
    return items && Object.keys(items).length > 0 ? items : null;
  },

  /**
   * prettyLog
   *
   * Logs messages with optional colored backgrounds based on the status parameter.
   * Logging is controlled by the config.log flag.
   *
   * @param {string} label - The message to log.
   * @param {string} [status=''] - The status of the message, which determines the background color.
   *                                Valid values are 'success', 'warning', 'info', or an empty string for the default console.log style.
   */
  prettyLog(label, status = '') {
    const logEnabled = typeof config !== 'undefined' ? config?.log : false;

    if (logEnabled) {
      const styles = {
        success: 'background-color: #49d65e; padding: 0.2rem 1.5rem;',
        warning: 'background-color: #de9250; padding: 0.2rem 1.5rem;',
        info: 'background-color: #d9de45; padding: 0.2rem 1.5rem;',
      };

      const style = styles[status] || '';

      console.log('%c' + label, style);
    }
  },

  /*
   * remove the survey root and return the text
   * useful when using dig() function
   * robust, can accept null, undefined and will always pass back null
   * @param {string} the string you want the root removed from.
   */
  removeRoot(path, defaultValue = null) {
    try {
      path = path.replace(/(^submission\.|^submission|^parent\.|^parent)+/g, '');
      return path;
    } catch (e) {
      return defaultValue;
    }
  },

  /**
   * this flatten works for objects, leaves any arrays untouched
   * @data {object} data the object you pass
   */
  flatten(data) {
    var result = {};
    var seenObjects = new Set();

    function recurse(cur, prop) {
      if (Object(cur) !== cur) {
        result[prop] = cur;
      } else if (seenObjects.has(cur)) {
        // Circular reference detected
        result[prop] = '[Circular]';
        return;
      } else if (Array.isArray(cur)) {
        seenObjects.add(cur);
        result[prop] = cur;
        seenObjects.delete(cur);
      } else {
        seenObjects.add(cur);
        var isEmpty = true;
        for (var p in cur) {
          isEmpty = false;
          recurse(cur[p], prop ? prop + '--' + p : p);
        }
        if (isEmpty && prop) result[prop] = {};
        seenObjects.delete(cur);
      }
    }

    recurse(data, '');
    return result;
  },
  /**
   * flatten works for objects AND arrays.  Uses Set() to handle circular references which can throw errors in browser (more in chrome than firefox)
   * @data {object} data the object you pass
   */
  flattenAll(data) {
    var result = {};
    var seenObjects = new Set();

    function recurse(cur, prop) {
      if (Object(cur) !== cur) {
        result[prop] = cur;
      } else if (seenObjects.has(cur)) {
        // Circular reference detected
        result[prop] = '[Circular]';
        return;
      } else if (Array.isArray(cur)) {
        seenObjects.add(cur);
        for (var i = 0, l = cur.length; i < l; i++) recurse(cur[i], prop + '.' + i);
        if (l == 0) result[prop] = [];
        seenObjects.delete(cur);
      } else {
        seenObjects.add(cur);
        var isEmpty = true;
        for (var p in cur) {
          isEmpty = false;
          recurse(cur[p], prop ? prop + '.' + p : p);
        }
        if (isEmpty && prop) result[prop] = {};
        seenObjects.delete(cur);
      }
    }

    recurse(data, '');
    return result;
  },

  /**
   * apply this to a flattened version of the survey.resources survey.revisions (most recent revision only)
   * enter a value, and it returns the label for that value
   * if it has a value and the label is empty, it returns the value
   * useful for user inputted answers and answers populated from past submissions
   * WARNING! if the value isn't unique, this can't guarantee it's finding the correct one!
   * @res {object} survey.resources
   * @rev {object} survey.revisions[survey.revisions.length - 1] (only most recent revision)
   * @value {object} the value you want to find the label for
   */
  getLabels(res, rev, value) {
    let labels = [];
    // first, look for the key in the survey itself
    // applies if it's a checkbox or single select
    Object.keys(rev).forEach((key) => {
      if (rev[key] === value && key.slice(-6) === '.value') {
        console.log(`${key} :: ${rev[key.slice(0, -6) + '.label']}`);
        labels.push(rev[key.slice(0, -6) + '.label']);
      }
    });
    // now look for the key in the resources section
    // applies if it's a dropdown or resource referenced list
    Object.keys(res).forEach((key) => {
      if (res[key] === value && key.slice(-6) === '.value') {
        // if the value matches AND key is .value
        console.log(`${key} :: ${res[key.slice(0, -6) + '.label']}`);
        labels.push(res[key.slice(0, -6) + '.label']);
      }
    });
    // if no label is found, just return the value
    if (labels.length === 0) labels.push(value);
    return labels;
  },
};

export const utils = {
  match,
  checkIfAny,
  checkIfNone,
  getCleanArray,
  getClean,
  getResourceAsText,
  getResourceAsArrayBuffer,
  getResource,
  parseText,
  parseArrayBuffer,
  unstable,
};

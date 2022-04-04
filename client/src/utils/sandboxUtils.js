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
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'RETURN_RESOURCE') {
        resolve(event.data.payload.file);
      }
    });
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

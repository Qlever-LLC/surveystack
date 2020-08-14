import isEmail from 'isemail';
// run with node tests/isemail.js from command line

const testCases = [
  { value: 'andreas@example.com', want: true },
  { value: 'gmail.com', want: false },
  { value: 'andreas@gmail', want: true }, // strictly speaking, this is indeed a valid email address
  { value: 'andreas', want: false },
  { value: 'andreas+bugmenot@example.swiss.com', want: true },
  { value: 'and reas@example.com', want: false },
];

for (let testCase of testCases) {
  const got = isEmail.validate(testCase.value);
  if (got) {
    console.log(`  ${testCase.value} is a valid email address`);
  } else {
    console.log(`  ${testCase.value} is NOT a valid email address`);
  }

  if (testCase.want !== got) {
    const errorMessage = `value: ${testCase.value}, want: ${testCase.want}, got: ${got}`;
    throw Error(errorMessage);
  }
}

console.log('All test completed successfully');

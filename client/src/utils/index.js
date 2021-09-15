/**
 * Check if string is valid username.
 * Username may contain a-z, 0-9, '_', '-' with a length of 3 - 30 characters.
 * Should start with a letter.
 * @param {string} str - string to test
 */
export const isValidUsername = (str) => {
  const regex = /^[a-z][a-z0-9-_]{2,29}$/g;
  if (regex.test(str)) {
    return true;
  }

  return false;
};

/*
  const testCases = [
    { value: "Super", want: false },
    { value: "super", want: true },
    { value: "super-131a", want: true },
    { value: "super/dq", want: false },
    { value: "süpradin", want: false },
    { value: "supradin", want: true },
    { value: "super-_qc123", want: true },
    { value: "", want: false },
    { value: " ", want: false },
    { value: "a", want: false },
    { value: "ab", want: false },
    { value: "abc", want: true }
  ];

  testCases.forEach(t => {
    let got = isValidUsername(t.value);
    console.log(`'${t.value}' is ${got ? "valid" : "invalid"}`);
    if (got !== t.want) {
      console.log(`  => ERROR: value='${t.value}, want=${t.want}, got=${got}'`);
    }
  });
*/

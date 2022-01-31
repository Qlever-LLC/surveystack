# Feture Toggles

SurveyStack uses [Unleash](https://github.com/Unleash/unleash) and its [GitLab integration](https://docs.gitlab.com/ee/operations/feature_flags.html) to manage feature toggles.

## Creating a new toggle
 - Go to https://gitlab.com/our-sci/software/surveystack/-/feature_flags 
 - Click `New feature flag`
 - Set a unique name (this name will be used in the source code to query the state of the toggle)
 - Click `Create feature flag`  

*TODO: Add notes for rollout strategies*

## Reading a toggle in NodeJS
Use `isToggleOn(featureName)` to check if a toggle is enabled.

Example:
```js
import { isToggleOn } from '../services/featureToggle.service';

router.get('/toggle-test', async (req, res) => {
  if (await isToggleOn('test-feature')) {
    res.send('Toggle is ON');
  } else {
    res.send('Toggle is OFF');
  }
});
```

## Reading a toggle in Vue
Read the toggle state from `toggle/isOn` Vuex getter

Example:
```jsx
<div v-if="$store.getters['toggle/isOn']['test-feature']">Toggle ON</div>
<div v-else>Toggle OFF</div>
```

# Removing a toggle 
After a toggle has been enabled for a while and the feature seems to be stable we have to remove the toggle from the app.

 1. Remove the toggle conditions from the app. Since we always have to use the toggle name when reading its state, searching for it should return every usage of the toggle.
 2. Deploy a new version of the app.
 3. After you are sure that most of the clients are updated to the new version, remove the feature flag from the GitLab dashboard.
    - You can use sentry.io to check how many of the users are updated to the new version.
    - Probably a good practice to mark the date of removal on the GitLab dashboard, in the feature flag description. 

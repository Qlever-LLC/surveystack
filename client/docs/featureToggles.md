# Feture Toggles

SurveyStack uses [Unleash](https://github.com/Unleash/unleash) and its [GitLab integration](https://docs.gitlab.com/ee/operations/feature_flags.html) to manage feature toggles.

## Creating a new toggle
 - Go to https://gitlab.com/our-sci/software/surveystack/-/feature_flags 
 - Click `New feature flag`
 - Set a unique name (this name will be used in the source code to query the state of the toggle)
 - Click `Create feature flag`  

*TODO: Add notes for rollout strategies*

## Reading a toggle in NodeJS
Use `res.locals.isToggleOn(featureName)` to check if a toggle is enabled.

Example:
```js
router.get('/toggle-test', async (req, res) => {
  if (await res.locals.isToggleOn('test-feature')) {
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

## Removing a toggle 
After a toggle has been enabled for a while and the feature seems to be stable we have to remove the toggle from the app.

 1. Remove the toggle conditions from the app. Since we always have to use the toggle name when reading its state, searching for it should return every usage of the toggle.
 2. Deploy a new version of the app.
 3. After you are sure that most of the clients are updated to the new version, remove the feature flag from the GitLab dashboard.
    - You can use sentry.io to check how many of the users are updated to the new version.
    - Probably a good practice to mark the date of removal on the GitLab dashboard, in the feature flag description. 


## Implementation details
 - GitLab can host an [unleash server](https://github.com/Unleash/unleash) for every project
 - The SurveyStack backend runs the [unleash proxy](https://github.com/Unleash/unleash-proxy) on the `/api/toggles` endpoint
    - This connects to the Unleash server provided by GitLab
 - The client connects to the proxy and keeps toggle states up to date in the `toggle` Vuex store
 - The backend can read toggle states directly from the proxy with the `isToggleOn` helper


## Further development
The free hosted Unleash server is convenient, but its feature set is limited. If we need more features in the future, we could
 - Run our own unleash server. Unleash is open-source with a free core, so we can host our instance, even as part of the main NodeJS process. (It requires a Postgress DB)
 - Implement our solution. All requests goes through the Unleash Proxy in our NodeJS backend. We could replace this with something that reads toggle states from our DB. 
